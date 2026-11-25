import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatOptgroup } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  IHasPropertyWithPropertyDefinition,
  KnoraApiConnection,
  ListNodeV2,
  ReadResource,
  ReadResourceSequence,
  ResourcePropertyDefinition,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { APIV3ApiService, BatchChangesRequest } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import {
  propertiesTypeMapping,
  PropertyValuesCreatorComponent,
} from '@dasch-swiss/vre/resource-editor/resource-editor';
import { PropertyInfoValues, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  finalize,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import {
  batchChangeOf,
  batchesOf,
  BulkEditChange,
  BulkEditListOption,
  BulkEditNewValue,
  BulkEditSetOperation,
  BulkEditPlan,
  bulkEditRequest,
  BulkEditTarget,
  bulkEditTargets,
  canOverwrite,
  canRemove,
  canSet,
  existingValues,
  flattenList,
  planBulkEdit,
  richTextDisplay,
} from './bulk-edit-plan';

export interface BulkEditDialogProps {
  resourceIris: string[];
  /** Which resources these are, e.g. what a search keeps; without it the panel names the selected count. */
  scope?: string;
}

/** The IRIs of the resources that got at least one value written. */
export type BulkEditDialogResult = string[];

type Step = 'loading' | 'loadFailed' | 'edit' | 'applying' | 'done';

type BulkEditAction = 'set' | 'remove';

/** Whether one change was written. */
interface BulkEditOutcome {
  change: BulkEditChange;
  ok: boolean;
}

interface FormValue {
  property: string | null;
  /** Null for a property that can only be removed, until the user chooses to: nothing is removed by default. */
  action: BulkEditAction | null;
  label: string;
  /** What the creation form's editors hold: the text, the rich text's HTML or the list node IRI, and a comment. */
  values: { item: unknown; comment: string | null }[];
  onlyEmpty: boolean;
}

type ValueGroup = FormGroup<{ item: AbstractControl; comment: FormControl<string | null> }>;

/** dsp-api's `POST /v2/resources/batch` reads at most this many resources in one request. */
const READ_CHUNK_SIZE = 100;
/** Read requests in flight at once. */
const READ_CONCURRENCY = 4;

/** Opened as a side panel (`DspDialogConfig.dialogDrawerConfig`); the preview follows the form as it is filled. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bulk-edit-dialog',
  template: `
    <header class="header">
      <div class="top">
        <h2 class="mat-headline-6 title">{{ 'pages.dataBrowser.bulkEdit.title' | translate }}</h2>
        <span class="scope" data-cy="bulk-edit-scope">
          <mat-icon aria-hidden="true">{{ data.scope ? 'filter_list' : 'check_box' }}</mat-icon>
          <span class="scope-text">
            {{ data.scope ?? ('pages.dataBrowser.bulkEdit.subtitle' | translate: { count: data.resourceIris.length }) }}
          </span>
        </span>
        <button
          mat-icon-button
          type="button"
          class="close"
          [disabled]="step() === 'applying'"
          [attr.aria-label]="'ui.common.actions.close' | translate"
          (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </header>

    <div class="body" [class.split]="step() === 'edit'">
      @switch (step()) {
        @case ('loading') {
          <div class="loading">
            <app-progress-indicator />
            <p class="note" data-cy="bulk-edit-loading">
              {{
                'pages.dataBrowser.bulkEdit.loading'
                  | translate: { loaded: loadedCount() | number, total: data.resourceIris.length | number }
              }}
            </p>
          </div>
        }
        @case ('loadFailed') {
          <p class="error" data-cy="bulk-edit-load-failed">{{ 'pages.dataBrowser.bulkEdit.loadFailed' | translate }}</p>
        }
        @case ('edit') {
          @if (target(); as currentTarget) {
            <form [formGroup]="form" class="form">
              <div class="block">
                <span class="block-label">{{ 'pages.dataBrowser.bulkEdit.edit' | translate }}</span>
                <mat-form-field class="property-field compact-value-editor">
                  <!-- The label stands alone; the properties follow under one header, whatever their type. -->
                  <mat-select
                    formControlName="property"
                    panelClass="bulk-edit-property-panel"
                    data-cy="bulk-edit-property"
                    [attr.aria-label]="'pages.dataBrowser.bulkEdit.edit' | translate">
                    @if (labelTarget(); as label) {
                      <mat-option [value]="label.id">{{ label.label }}</mat-option>
                    }
                    @if (propertyTargets().length) {
                      <mat-optgroup [label]="'pages.dataBrowser.bulkEdit.properties' | translate">
                        @for (option of propertyTargets(); track option.id) {
                          <mat-option [value]="option.id">
                            {{ option.label }}
                            @if (option.kind === 'other') {
                              <span class="option-tag">{{ 'pages.dataBrowser.bulkEdit.removeOnly' | translate }}</span>
                            }
                          </mat-option>
                        }
                      </mat-optgroup>
                    }
                  </mat-select>
                </mat-form-field>
                <span class="chips">
                  @if (isRequired()) {
                    <span class="kind-chip">{{ 'pages.dataBrowser.bulkEdit.required' | translate }}</span>
                  }
                  @if (isMultiple()) {
                    <span class="kind-chip">{{ 'pages.dataBrowser.bulkEdit.severalAllowed' | translate }}</span>
                  }
                </span>
              </div>

              @if (currentTarget.kind !== 'label') {
                <div class="block">
                  <span class="block-label" id="bulk-edit-action">
                    {{ 'pages.dataBrowser.bulkEdit.action' | translate }}
                  </span>
                  <mat-button-toggle-group
                    class="actions"
                    formControlName="action"
                    aria-labelledby="bulk-edit-action"
                    data-cy="bulk-edit-action"
                    hideSingleSelectionIndicator>
                    <mat-button-toggle value="set" [disabled]="!canSetTarget()" data-cy="bulk-edit-action-set">
                      <mat-icon>{{ canSetTarget() ? 'edit' : 'lock' }}</mat-icon>
                      {{ 'pages.dataBrowser.bulkEdit.setValue' | translate }}
                    </mat-button-toggle>
                    <mat-button-toggle
                      value="remove"
                      class="remove-toggle"
                      [disabled]="!canRemoveTarget()"
                      data-cy="bulk-edit-action-remove">
                      <mat-icon>{{ canRemoveTarget() ? 'delete_sweep' : 'lock' }}</mat-icon>
                      {{ 'pages.dataBrowser.bulkEdit.removeValues' | translate }}
                    </mat-button-toggle>
                  </mat-button-toggle-group>
                  @if (!canSetTarget()) {
                    <p class="hint" data-cy="bulk-edit-set-unsupported">
                      <mat-icon aria-hidden="true" class="hint-icon">lock</mat-icon>
                      {{ 'pages.dataBrowser.bulkEdit.setNotSupported' | translate }}
                    </p>
                  }
                  @if (!canRemoveTarget()) {
                    <p class="hint" data-cy="bulk-edit-remove-required">
                      <mat-icon aria-hidden="true" class="hint-icon">lock</mat-icon>
                      {{ 'pages.dataBrowser.bulkEdit.removeRequired' | translate: { property: currentTarget.label } }}
                    </p>
                  }
                </div>
              }

              @if (action() === 'remove') {
                <div class="remove-card" role="status" data-cy="bulk-edit-remove-card">
                  <mat-icon aria-hidden="true">delete_sweep</mat-icon>
                  <span>
                    <strong>{{
                      'pages.dataBrowser.bulkEdit.removeCardTitle' | translate: { property: currentTarget.label }
                    }}</strong>
                    {{ 'pages.dataBrowser.bulkEdit.removeCardHint' | translate }}
                  </span>
                </div>
              }

              @if (action() === 'set') {
                <div class="block">
                  <span class="block-label">
                    {{
                      (valueCount() > 1
                        ? 'pages.dataBrowser.bulkEdit.newValues'
                        : 'pages.dataBrowser.bulkEdit.newValue'
                      ) | translate
                    }}
                  </span>
                  @if (currentTarget.kind === 'label') {
                    <div class="compact-value-editor">
                      <mat-form-field>
                        <input
                          matInput
                          formControlName="label"
                          data-cy="bulk-edit-value-0"
                          [attr.aria-label]="'pages.dataBrowser.bulkEdit.newValue' | translate" />
                      </mat-form-field>
                    </div>
                    <p class="hint">{{ 'pages.dataBrowser.bulkEdit.setValueHint' | translate }}</p>
                  } @else {
                    <!-- The values exactly as the resource creation form shows them, recreated for each property. -->
                    @for (info of [propertyInfo()!]; track info.propDef.id) {
                      <app-property-values-creator
                        class="compact-value-editor creator"
                        data-cy="bulk-edit-values"
                        [myProperty]="info"
                        [formArray]="form.controls.values"
                        [resourceClassIri]="project().resourceClassIri"
                        [projectIri]="project().projectIri"
                        [projectShortcode]="project().projectShortcode" />
                    }
                  }
                  @if (listLoadFailed()) {
                    <p class="error" data-cy="bulk-edit-list-load-failed">
                      {{ 'pages.dataBrowser.bulkEdit.listLoadFailed' | translate }}
                    </p>
                  }
                </div>

                @if (currentTarget.kind !== 'label') {
                  <div class="block">
                    <span class="block-label" id="bulk-edit-which">
                      {{ 'pages.dataBrowser.bulkEdit.whichResources' | translate }}
                    </span>
                    <mat-radio-group
                      class="choices"
                      formControlName="onlyEmpty"
                      aria-labelledby="bulk-edit-which"
                      data-cy="bulk-edit-only-empty">
                      <mat-radio-button class="choice" [value]="true" data-cy="bulk-edit-choice-empty">
                        <span class="choice-text">
                          <span class="choice-title">{{
                            'pages.dataBrowser.bulkEdit.onlyWhereEmpty' | translate
                          }}</span>
                          <span class="choice-hint">
                            {{
                              'pages.dataBrowser.bulkEdit.onlyWhereEmptyHint'
                                | translate: { property: currentTarget.label }
                            }}
                          </span>
                        </span>
                        <span class="badge" data-cy="bulk-edit-choice-empty-count">{{
                          choiceCounts().empty | number
                        }}</span>
                      </mat-radio-button>
                      <mat-radio-button
                        class="choice"
                        [value]="false"
                        [disabled]="onlyEmptyLocked()"
                        data-cy="bulk-edit-choice-replace">
                        <span class="choice-text">
                          <span class="choice-title">{{ 'pages.dataBrowser.bulkEdit.alsoReplace' | translate }}</span>
                          <span class="choice-hint">
                            @if (onlyEmptyLocked()) {
                              <mat-icon aria-hidden="true" class="hint-icon">lock</mat-icon>
                              {{ 'pages.dataBrowser.bulkEdit.alsoReplaceLocked' | translate }}
                            } @else {
                              {{
                                'pages.dataBrowser.bulkEdit.alsoReplaceHint'
                                  | translate: { property: currentTarget.label }
                              }}
                            }
                          </span>
                        </span>
                        <span class="badge" data-cy="bulk-edit-choice-replace-count">
                          {{ onlyEmptyLocked() ? '—' : (choiceCounts().replace | number) }}
                        </span>
                      </mat-radio-button>
                    </mat-radio-group>
                    @if (choicesAlike()) {
                      <p class="hint" data-cy="bulk-edit-choices-alike">
                        {{ 'pages.dataBrowser.bulkEdit.choicesAlike' | translate: { count: choiceCounts().empty } }}
                      </p>
                    }
                  </div>
                }
              }
            </form>

            <section
              class="preview"
              [style.--label-width]="labelWidth()"
              [attr.aria-label]="'pages.dataBrowser.bulkEdit.preview' | translate">
              <div class="preview-header">
                <mat-icon aria-hidden="true">visibility</mat-icon>
                <span class="preview-title">{{ 'pages.dataBrowser.bulkEdit.preview' | translate }}</span>
                @if (plan()) {
                  <span class="preview-count" data-cy="bulk-edit-preview-count">
                    {{
                      'pages.dataBrowser.bulkEdit.previewCount'
                        | translate: { changed: changedResourceCount(), total: resourceCount() }
                    }}
                  </span>
                }
              </div>
              <div class="preview-list">
                @if (plan(); as p) {
                  @for (group of outcomeGroups(); track group.kind) {
                    <div class="group" [attr.data-cy]="'bulk-edit-group-' + group.kind">
                      <button
                        type="button"
                        class="group-header"
                        [attr.aria-expanded]="isOpen(group.kind)"
                        (click)="toggleGroup(group.kind)">
                        <mat-icon aria-hidden="true" class="chevron">
                          {{ isOpen(group.kind) ? 'expand_less' : 'expand_more' }}
                        </mat-icon>
                        <mat-icon aria-hidden="true" [class]="'status ' + group.kind">{{ group.icon }}</mat-icon>
                        <span class="group-title">{{ group.titleKey | translate }}</span>
                        <span class="group-count">{{ group.count }}</span>
                      </button>
                      @if (isOpen(group.kind)) {
                        @for (item of group.items; track item.resource.id) {
                          <div class="group-item" data-cy="bulk-edit-change">
                            <span class="item-label">{{ item.resource.label }}</span>
                            <span class="item-values">
                              @if (group.kind === 'removed') {
                                @for (change of item.changes; track $index) {
                                  <del class="value">{{ change.before }}</del>
                                }
                                <mat-icon aria-hidden="true" class="arrow">arrow_forward</mat-icon>
                                <span class="empty">{{ 'pages.dataBrowser.bulkEdit.emptyValue' | translate }}</span>
                              } @else {
                                @for (change of item.changes; track $index) {
                                  @if (change.before !== null) {
                                    <del class="value">{{ change.before }}</del>
                                    <mat-icon aria-hidden="true" class="arrow">arrow_forward</mat-icon>
                                  }
                                  <ins class="value">{{ change.after }}</ins>
                                }
                              }
                            </span>
                          </div>
                        }
                        @for (reason of group.reasons; track reason.key) {
                          <div class="group-item reason" [attr.data-cy]="'bulk-edit-reason-' + reason.key">
                            {{ reason.labelKey | translate: { count: reason.count } }}
                          </div>
                        }
                      }
                    </div>
                  }
                  @if (!p.changes.length) {
                    <p class="note" data-cy="bulk-edit-nothing-to-change">
                      {{ 'pages.dataBrowser.bulkEdit.nothingToChange' | translate }}
                    </p>
                  }
                } @else {
                  @if (currentValues(); as current) {
                    <div class="current" data-cy="bulk-edit-current">
                      <div class="current-header">
                        <span>{{
                          'pages.dataBrowser.bulkEdit.currentValues' | translate: { property: target()?.label }
                        }}</span>
                        <span class="group-count">
                          {{
                            'pages.dataBrowser.bulkEdit.currentHave'
                              | translate: { count: current.rows.length, total: resourceCount() }
                          }}
                        </span>
                      </div>
                      @for (row of current.rows; track row.resource.id) {
                        <div class="group-item">
                          <span class="item-label">{{ row.resource.label }}</span>
                          <span class="item-values">
                            @for (value of row.values; track $index) {
                              <span class="value current-value">{{ value }}</span>
                            }
                          </span>
                        </div>
                      }
                    </div>
                  }
                  <p class="note">{{ 'pages.dataBrowser.bulkEdit.previewEmpty' | translate }}</p>
                }
              </div>
            </section>
          }
        }
        @default {
          <p class="summary">{{ summary() }}</p>
          <mat-progress-bar mode="determinate" [value]="progress()" />
          @if (step() === 'done') {
            <p class="result" data-cy="bulk-edit-done">
              @if (succeeded().length) {
                <mat-icon aria-hidden="true" class="ok">check_circle</mat-icon>
              } @else {
                <mat-icon aria-hidden="true" class="error">error</mat-icon>
              }
              {{
                (action() === 'remove'
                  ? 'pages.dataBrowser.bulkEdit.doneRemovedSummary'
                  : 'pages.dataBrowser.bulkEdit.doneSummary'
                ) | translate: { updated: succeeded().length }
              }}
              @if (failed().length) {
                ·
                <span class="error" data-cy="bulk-edit-failed">
                  {{ 'pages.dataBrowser.bulkEdit.failedSummary' | translate: { failed: failed().length } }}
                </span>
              }
            </p>
            @if (skippedCount()) {
              <p class="note">
                {{ 'pages.dataBrowser.bulkEdit.cancelledSummary' | translate: { skipped: skippedCount() } }}
              </p>
            }
          } @else {
            <p class="note">
              {{ 'pages.dataBrowser.bulkEdit.applying' | translate: { done: processed(), total: running().length } }}
            </p>
          }
          <section class="preview">
            <div class="preview-header">
              <span class="preview-title">{{ 'pages.dataBrowser.bulkEdit.result' | translate }}</span>
            </div>
            <div class="preview-list">
              @for (change of failed(); track $index) {
                <div class="change" data-cy="bulk-edit-failed-change">
                  <mat-icon aria-hidden="true" class="error">error_outline</mat-icon>
                  <div class="label">{{ change.resource.label }}</div>
                  <span class="error">{{ 'pages.dataBrowser.bulkEdit.couldNotUpdate' | translate }}</span>
                </div>
              }
              @for (change of succeeded(); track $index) {
                <div class="change">
                  <mat-icon aria-hidden="true" class="ok">check</mat-icon>
                  <div class="label">{{ change.resource.label }}</div>
                  <ins>{{ change.after }}</ins>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>

    <footer class="footer">
      @switch (step()) {
        @case ('edit') {
          @if (confirming()) {
            <!-- Removing asks once more, with the exact counts. -->
            <div class="confirm" role="alertdialog" data-cy="bulk-edit-confirm">
              <mat-icon aria-hidden="true">warning</mat-icon>
              <span class="confirm-text">
                <strong>
                  {{
                    'pages.dataBrowser.bulkEdit.confirmRemove'
                      | translate: { values: plan()?.changes?.length ?? 0, resources: changedResourceCount() }
                  }}
                </strong>
                {{ 'pages.dataBrowser.bulkEdit.confirmRemoveHint' | translate }}
              </span>
              <button mat-button type="button" data-cy="bulk-edit-confirm-back" (click)="confirming.set(false)">
                {{ 'pages.dataBrowser.bulkEdit.back' | translate }}
              </button>
              <button
                mat-flat-button
                class="danger"
                type="button"
                data-cy="bulk-edit-confirm-remove"
                (click)="confirming.set(false); apply(plan()!.changes)">
                <mat-icon>delete</mat-icon>
                {{ 'pages.dataBrowser.bulkEdit.remove' | translate }}
              </button>
            </div>
          } @else {
            <span class="footer-hint"></span>
            <button mat-button type="button" (click)="close()">{{ 'ui.common.actions.cancel' | translate }}</button>
            @if (target()) {
              @if (action() === 'remove') {
                <button
                  mat-flat-button
                  class="danger"
                  type="button"
                  data-cy="bulk-edit-apply"
                  [disabled]="!plan()?.changes?.length"
                  (click)="confirming.set(true)">
                  <mat-icon>delete</mat-icon>
                  {{ 'pages.dataBrowser.bulkEdit.removeFrom' | translate: { count: changedResourceCount() } }}
                </button>
              } @else {
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  data-cy="bulk-edit-apply"
                  [disabled]="!plan()?.changes?.length"
                  (click)="apply(plan()!.changes)">
                  {{ 'pages.dataBrowser.bulkEdit.applyTo' | translate: { count: changedResourceCount() } }}
                </button>
              }
            }
          }
        }
        @case ('applying') {
          <span class="footer-hint"></span>
          <button mat-button type="button" data-cy="bulk-edit-cancel-remaining" (click)="cancelRemaining()">
            {{ 'pages.dataBrowser.bulkEdit.cancelRemaining' | translate }}
          </button>
        }
        @case ('done') {
          @if (failed().length) {
            <button mat-button type="button" data-cy="bulk-edit-retry" (click)="apply(failed())">
              <mat-icon>replay</mat-icon>
              {{ 'pages.dataBrowser.bulkEdit.retryFailed' | translate }}
            </button>
          }
          <span class="footer-hint"></span>
          <button mat-stroked-button type="button" data-cy="bulk-edit-again" (click)="editAgain()">
            {{ 'pages.dataBrowser.bulkEdit.editAgain' | translate }}
          </button>
          <button mat-flat-button color="primary" type="button" data-cy="bulk-edit-close" (click)="close()">
            {{ 'ui.common.actions.close' | translate }}
          </button>
        }
        @default {
          <span class="footer-hint"></span>
          <button mat-flat-button color="primary" type="button" data-cy="bulk-edit-close" (click)="close()">
            {{ 'ui.common.actions.close' | translate }}
          </button>
        }
      }
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .header {
        padding: 12px 8px 0 24px;
        border-bottom: 1px solid #e5e7eb; /* $cool-gray-200 */
      }
      .top {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 8px;
      }
      .title {
        margin: 0;
        flex: none;
      }
      .scope {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        padding: 2px 10px;
        border-radius: 12px;
        background: #e8eef4;
        color: #264c6a;
        font-size: 12px;
        font-weight: 500;
      }
      .scope mat-icon {
        flex: none;
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .scope-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .close {
        margin-left: auto;
        flex: none;
      }
      /* The preview takes the height the form leaves; only its list scrolls. */
      .body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 24px;
        overflow: auto;
      }
      /* Editing: the form on the left, the preview beside it, each scrolling on its own. */
      .body.split {
        flex-direction: row;
        gap: 0;
        padding: 0;
        overflow: hidden;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        flex: none;
      }
      .split .form {
        width: 540px;
        padding: 20px 20px 20px 24px;
        border-right: 1px solid #e5e7eb; /* $cool-gray-200 */
        overflow: auto;
      }
      .split .preview {
        flex: 1;
        min-width: 0;
        margin: 16px;
        background: #fff;
      }
      .split {
        background: #f9fafb; /* $cool-gray-50 */
      }
      .split .form {
        background: #fff;
      }
      .block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .block-label {
        font-size: 12px;
        font-weight: 500;
        color: #4b5563; /* $cool-gray-600 */
      }
      .property-field {
        width: 100%;
      }
      .chips {
        display: flex;
        gap: 6px;
      }
      .chips:empty {
        display: none;
      }
      .option-tag {
        margin-left: auto;
        padding: 0 6px;
        border-radius: 8px;
        background: #f3f4f6; /* $cool-gray-100 */
        color: #6b7280; /* $cool-gray-500 */
        font-size: 11px;
        font-weight: 500;
        line-height: 18px;
      }
      /*
       * The picker's panel opens in an overlay, outside this component: compact options, the properties not
       * indented under their one header, and the "Remove only" tag on the right.
       */
      ::ng-deep .bulk-edit-property-panel .mat-mdc-option {
        min-height: 38px;
        font-size: 14px;
      }
      ::ng-deep .bulk-edit-property-panel .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
        padding-left: 16px;
      }
      ::ng-deep .bulk-edit-property-panel .mat-mdc-option .mdc-list-item__primary-text {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      ::ng-deep .bulk-edit-property-panel .mat-mdc-optgroup-label {
        min-height: 28px;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280; /* $cool-gray-500 */
      }
      /* Compact like the editors, the selection in the app's blue; removing in red. */
      .actions {
        align-self: flex-start;
        --mat-button-toggle-height: 32px;
        --mat-button-toggle-label-text-size: 13px;
        --mat-button-toggle-label-text-line-height: 32px;
        --mat-button-toggle-selected-state-background-color: #e8eef4;
        --mat-button-toggle-selected-state-text-color: #264c6a;
      }
      .actions ::ng-deep .mat-button-toggle-label-content {
        padding: 0 12px;
      }
      .actions mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
        margin-right: 4px;
        vertical-align: -3px;
      }
      .actions .remove-toggle.mat-button-toggle-checked {
        background: #fdecef;
        color: #9f1239;
      }
      /* The creation form's add button, in the app's blue rather than black. */
      .creator ::ng-deep .mat-mdc-icon-button .mat-icon {
        color: #336790; /* $primary */
      }
      .remove-card {
        display: flex;
        gap: 10px;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
      }
      .remove-card {
        border: 1px solid #f3c2cd;
        background: #fff5f7;
        color: #7f1d2d;
      }
      .remove-card mat-icon {
        color: #b9193c; /* $red-800 */
      }
      .remove-card strong {
        display: block;
        font-weight: 500;
        color: #9f1239;
      }
      .danger {
        background: #b9193c; /* $red-800 */
        color: #fff;
      }
      .confirm {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #7f1d2d;
        font-size: 13px;
      }
      .confirm > mat-icon {
        color: #b9193c; /* $red-800 */
      }
      .confirm-text {
        flex: 1;
      }
      .confirm-text strong {
        font-weight: 500;
      }
      .status.removed {
        color: #b9193c; /* $red-800 */
      }
      .current-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: #fafafa;
        border-bottom: 1px solid #e5e7eb; /* $cool-gray-200 */
        font-size: 13px;
        font-weight: 500;
      }
      .current-header .group-count {
        margin-left: auto;
      }
      .current-value {
        background: #f3f4f6; /* $cool-gray-100 */
        color: #374151; /* $cool-gray-700 */
      }
      .kind-chip {
        align-self: flex-start;
        padding: 0 8px;
        border-radius: 9px;
        background: #f3f4f6; /* $cool-gray-100 */
        color: #4b5563; /* $cool-gray-600 */
        font-size: 11px;
        font-weight: 500;
        line-height: 18px;
      }
      .choices {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .choice {
        border: 1px solid #e5e7eb; /* $cool-gray-200 */
        border-radius: 6px;
        padding: 4px 10px 4px 0;
      }
      .choice.mat-mdc-radio-checked {
        border-color: #336790; /* $primary */
        background: #f5f8fb;
      }
      .choice ::ng-deep .mdc-form-field {
        width: 100%;
        align-items: flex-start;
      }
      .choice ::ng-deep .mdc-label {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding-top: 10px;
      }
      .choice-text {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .choice-title {
        font-weight: 500;
      }
      .choice-hint {
        font-size: 12px;
        line-height: 16px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .badge {
        flex: none;
        padding: 0 8px;
        border-radius: 11px;
        background: #f3f4f6; /* $cool-gray-100 */
        color: #374151; /* $cool-gray-700 */
        font-size: 12px;
        font-weight: 500;
        line-height: 22px;
        white-space: nowrap;
      }
      .choice.mat-mdc-radio-checked .badge {
        background: #336790; /* $primary */
        color: #fff;
      }
      .group {
        border-bottom: 1px solid #e5e7eb; /* $cool-gray-200 */
      }
      .group-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 0;
        background: #fafafa;
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
      }
      .group-header mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .chevron {
        color: #6b7280; /* $cool-gray-500 */
      }
      .status.new {
        color: #0f766e; /* $green-700 */
      }
      .status.replaced {
        color: #b45309; /* $amber-700 */
      }
      .status.unchanged {
        color: #9ca3af; /* $cool-gray-400 */
      }
      .group-title {
        flex: 1;
      }
      .group-count {
        font-size: 12px;
        font-weight: 400;
        color: #6b7280; /* $cool-gray-500 */
      }
      .group-item {
        display: flex;
        align-items: baseline;
        gap: 12px;
        padding: 3px 10px 3px 32px;
        border-top: 1px solid #f3f4f6; /* $cool-gray-100 */
        font-size: 12px;
        line-height: 18px;
      }
      .group-item.reason {
        color: #6b7280; /* $cool-gray-500 */
      }
      .item-label {
        flex: none;
        width: min(var(--label-width, 140px), 40%);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .item-values {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 6px;
      }
      .value {
        padding: 1px 6px;
        border-radius: 4px;
        text-decoration: none;
      }
      del.value {
        background: #fdecef;
        color: #b9193c; /* $red-800 */
        text-decoration: line-through;
      }
      ins.value {
        background: #e6f4f1;
        color: #115e59; /* $green-800 */
        font-weight: 500;
      }
      .arrow {
        width: 14px;
        height: 14px;
        font-size: 14px;
        color: #9ca3af; /* $cool-gray-400 */
      }
      .values {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      /* The creation form hangs each value's buttons in a 140px column right of the field. */
      .creator {
        display: block;
        margin-right: 96px;
      }
      .compact-value-editor mat-form-field {
        width: 100%;
      }
      .hint-icon {
        width: 14px;
        height: 14px;
        font-size: 14px;
        vertical-align: -2px;
      }
      .add-value,
      .only-empty {
        align-self: flex-start;
      }
      .only-empty .hint {
        margin: 0 0 0 40px;
      }
      .warning,
      .info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 8px 12px;
        border-radius: 4px;
        background: #fef3c7; /* $amber-100 */
        color: #78350f; /* $amber-900 */
        font-size: 13px;
      }
      .info {
        background: #f3f4f6; /* $cool-gray-100 */
        color: #374151; /* $cool-gray-700 */
      }
      .info mat-icon {
        color: #6b7280; /* $cool-gray-500 */
      }
      .warning mat-icon {
        color: #b45309; /* $amber-700 */
      }
      .hint {
        margin: 6px 0 0;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .preview {
        flex: 1;
        min-height: 160px;
        display: flex;
        flex-direction: column;
        border: 1px solid #e5e7eb; /* $cool-gray-200 */
        border-radius: 4px;
        overflow: hidden;
      }
      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #f9fafb; /* $cool-gray-50 */
        border-bottom: 1px solid #e5e7eb; /* $cool-gray-200 */
      }
      .preview-header mat-icon {
        color: #336790; /* $primary */
      }
      .preview-title {
        font-weight: 500;
      }
      .preview-count {
        margin-left: auto;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .preview-list {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
      .change {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 8px;
        padding: 10px 12px;
        border-bottom: 1px solid #f3f4f6; /* $cool-gray-100 */
      }
      .change .label {
        flex: 1 1 100%;
        font-weight: 500;
      }
      .change mat-icon + .label {
        flex: 1;
      }
      /* One line per value: a resource can get several. */
      .diff {
        flex: 1 1 100%;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .diff mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #9ca3af; /* $cool-gray-400 */
      }
      del {
        color: #b9193c; /* $red-800 */
      }
      ins {
        text-decoration: none;
        color: #115e59; /* $green-800 */
        font-weight: 500;
      }
      .chip {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 13px;
      }
      del.chip {
        background: #fdecef;
      }
      ins.chip {
        background: #e6f4f1;
      }
      .empty {
        font-style: italic;
        color: #9ca3af; /* $cool-gray-400 */
      }
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin: auto;
      }
      .note {
        margin: 0;
        padding: 10px 12px;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .summary {
        margin: 0;
        color: #4b5563; /* $cool-gray-600 */
      }
      .result {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-weight: 500;
      }
      .ok {
        color: #0d9488; /* $green-600 */
      }
      .error {
        color: #b9193c; /* $red-800 */
      }
      .footer {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-top: 1px solid #e5e7eb; /* $cool-gray-200 */
      }
      .footer button {
        flex: none;
      }
      .footer-hint {
        flex: 1;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
      }
    `,
  ],
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatRadioButton,
    MatRadioGroup,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatOptgroup,
    MatOption,
    MatProgressBar,
    MatSelect,
    TranslatePipe,
    AppProgressIndicatorComponent,
    PropertyValuesCreatorComponent,
  ],
  // The creation form's compact fields: outlined, with no error line reserved.
  providers: [
    StringifyStringLiteralPipe,
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } },
  ],
})
export class BulkEditDialogComponent {
  readonly data = inject<BulkEditDialogProps>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject<MatDialogRef<BulkEditDialogComponent, BulkEditDialogResult>>(MatDialogRef);
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _stringifyStringLiteral = inject(StringifyStringLiteralPipe);
  private readonly _translateService = inject(TranslateService);
  private readonly _resourceService = inject(ResourceService);
  private readonly _apiV3 = inject(APIV3ApiService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly form = new FormGroup({
    property: new FormControl<string | null>(null),
    action: new FormControl<BulkEditAction | null>('set'),
    label: new FormControl('', { nonNullable: true }),
    values: new FormArray<ValueGroup>([]),
    onlyEmpty: new FormControl(true, { nonNullable: true }),
  });

  readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly step = signal<Step>('loading');
  /** Resources read so far, while loading. */
  readonly loadedCount = signal(0);
  private readonly _resources = signal<ReadResource[]>([]);
  readonly resourceCount = computed(() => this._resources().length);
  readonly targets = computed(() => {
    const [first] = this._resources();
    return first ? bulkEditTargets(first).map(target => ({ ...target, label: this._labelOf(target) })) : [];
  });
  readonly labelTarget = computed(() => this.targets().find(target => target.kind === 'label') ?? null);
  /** Every editable property, A–Z: the user looks for a name, not a type. */
  readonly propertyTargets = computed(() =>
    this.targets()
      .filter(target => target.kind !== 'label')
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  readonly target = computed(() => this.targets().find(target => target.id === this.formValue().property) ?? null);
  /** The label is only ever set. */
  readonly action = computed(() => (this.target()?.kind === 'label' ? 'set' : this.formValue().action));
  readonly canSetTarget = computed(() => {
    const target = this.target();
    return !!target && canSet(target);
  });
  readonly canRemoveTarget = computed(() => {
    const target = this.target();
    return !!target && canRemove(target);
  });
  readonly isRequired = computed(() => {
    const target = this.target();
    return !!target && target.kind !== 'label' && !canRemove(target);
  });
  /** Removing waits for a second click in the footer. */
  readonly confirming = signal(false);
  /** What the resources hold now, shown until there is something to preview. */
  readonly currentValues = computed(() => {
    const target = this.target();
    if (!target || target.kind === 'label') {
      return null;
    }
    const rows = this._resources()
      .map(resource => ({ resource, values: existingValues(resource, target).map(value => value.display) }))
      .filter(row => row.values.length);
    return { rows };
  });
  readonly isMultiple = computed(() => {
    const target = this.target();
    return !!target && target.kind !== 'label' && target.multiple;
  });
  readonly valueCount = computed(() => (this.target()?.kind === 'label' ? 1 : this.formValue().values.length));
  /** The chosen property as the creation form's value editors take it. */
  readonly propertyInfo = computed<PropertyInfoValues | null>(() => {
    const target = this.target();
    if (!target || target.kind === 'label') {
      return null;
    }
    return {
      guiDef: {
        propertyIndex: target.id,
        cardinality: target.cardinality,
        isInherited: false,
        propertyDefinition: target.propertyDefinition,
      } as IHasPropertyWithPropertyDefinition,
      propDef: target.propertyDefinition as ResourcePropertyDefinitionWithAllLanguages,
      values: [],
    };
  });
  /** Several new values can only fill empty properties, so the checkbox locks ticked. */
  readonly onlyEmptyLocked = computed(() => !canOverwrite(this.valueCount()));
  /** What the editors need to know about the project, taken from the first resource. */
  readonly project = computed(() => {
    const [first] = this._resources();
    return {
      resourceClassIri: first?.type ?? '',
      projectIri: first?.attachedToProject ?? '',
      projectShortcode: first ? this._resourceService.getProjectShortcode(first.id) : '',
    };
  });

  readonly listOptions = signal<BulkEditListOption[]>([]);
  readonly listLoadFailed = signal(false);

  /** Null until the form says what to change. */
  readonly plan = computed<BulkEditPlan | null>(() => {
    const target = this.target();
    if (!target) {
      return null;
    }
    const action = this.action();
    if (action === 'remove') {
      return canRemove(target) ? planBulkEdit(this._resources(), target, { kind: 'remove' }) : null;
    }
    const operation = action === 'set' && canSet(target) && _operationOf(target, this.formValue(), this.listOptions());
    return operation ? planBulkEdit(this._resources(), target, operation) : null;
  });
  readonly changedResourceCount = computed(
    () => new Set(this.plan()?.changes.map(change => change.resource.id) ?? []).size
  );
  /** What happens to each resource, as the preview groups it: new values, replaced values, unchanged. */
  readonly outcomeGroups = computed(() => {
    const plan = this.plan();
    if (!plan) {
      return [];
    }
    const byResource = new Map<string, { resource: ReadResource; changes: BulkEditChange[] }>();
    for (const change of plan.changes) {
      const item = byResource.get(change.resource.id) ?? { resource: change.resource, changes: [] };
      item.changes.push(change);
      byResource.set(change.resource.id, item);
    }
    const items = [...byResource.values()];
    const isLabel = this.target()?.kind === 'label';
    const removing = this.action() === 'remove';
    const removed = removing ? items : [];
    const replaced = removing ? [] : items.filter(item => isLabel || item.changes.some(change => change.value));
    const added = removing ? [] : items.filter(item => !replaced.includes(item));
    const reasons = [
      {
        key: 'hasValue',
        labelKey: removing ? 'pages.dataBrowser.bulkEdit.reasonEmpty' : 'pages.dataBrowser.bulkEdit.reasonHasValue',
        count: plan.unchangedCount,
      },
      { key: 'several', labelKey: 'pages.dataBrowser.bulkEdit.reasonSeveral', count: plan.severalKeptCount },
      {
        key: 'noRights',
        labelKey: removing
          ? 'pages.dataBrowser.bulkEdit.reasonNoDeleteRights'
          : 'pages.dataBrowser.bulkEdit.reasonNoRights',
        count: plan.noRightsCount,
      },
    ].filter(reason => reason.count);
    const none: typeof reasons = [];
    return [
      {
        kind: 'removed' as const,
        icon: 'remove_circle',
        titleKey: 'pages.dataBrowser.bulkEdit.outcomeRemoved',
        count: removed.length,
        items: removed,
        reasons: none,
      },
      {
        kind: 'new' as const,
        icon: 'add_circle',
        titleKey: 'pages.dataBrowser.bulkEdit.outcomeNew',
        count: added.length,
        items: added,
        reasons: none,
      },
      {
        kind: 'replaced' as const,
        icon: isLabel ? 'edit' : 'change_circle',
        titleKey: isLabel ? 'pages.dataBrowser.bulkEdit.outcomeLabel' : 'pages.dataBrowser.bulkEdit.outcomeReplaced',
        count: replaced.length,
        items: replaced,
        reasons: none,
      },
      {
        kind: 'unchanged' as const,
        icon: 'remove_circle_outline',
        titleKey: 'pages.dataBrowser.bulkEdit.outcomeUnchanged',
        count: reasons.reduce((sum, reason) => sum + reason.count, 0),
        items: [] as typeof items,
        reasons,
      },
    ].filter(group => group.count);
  });
  /** Unchanged resources start folded: they only explain why. */
  private readonly _folded = signal(new Set<string>(['unchanged']));
  /** Both choices change the same resources: nothing would be replaced, so the choice does not matter. */
  readonly choicesAlike = computed(() => {
    const { empty, replace } = this.choiceCounts();
    return !this.onlyEmptyLocked() && empty > 0 && empty === replace;
  });
  /** The preview's name column fits the longest name, up to 40% of the preview (see `.item-label`). */
  readonly labelWidth = computed(() => {
    const longest = Math.max(10, ...this._resources().map(resource => resource.label.length));
    return `${Math.ceil(longest * 1.1)}ch`;
  });
  /** How many resources each choice changes, shown before the user picks; a placeholder value counts them early. */
  readonly choiceCounts = computed(() => {
    const target = this.target();
    if (!target || !canSet(target) || target.kind === 'label') {
      return { empty: 0, replace: 0 };
    }
    const values = _operationOf(target, this.formValue(), this.listOptions())?.values ?? [
      { content: '\u0000', display: '' },
    ];
    const count = (onlyEmpty: boolean) =>
      new Set(planBulkEdit(this._resources(), target, { values, onlyEmpty }).changes.map(c => c.resource.id)).size;
    return { empty: count(true), replace: count(false) };
  });

  readonly running = signal<BulkEditChange[]>([]);
  readonly processed = signal(0);
  readonly succeeded = signal<BulkEditChange[]>([]);
  readonly failed = signal<BulkEditChange[]>([]);
  readonly progress = computed(() => (this.running().length ? (this.processed() / this.running().length) * 100 : 0));
  readonly skippedCount = computed(() => (this.step() === 'done' ? this.running().length - this.processed() : 0));
  readonly summary = computed(() => {
    const actionKey = this.action() === 'remove' ? 'removeValues' : 'setValue';
    return `${this.target()?.label ?? ''} · ${this._translateService.instant(`pages.dataBrowser.bulkEdit.${actionKey}`)}`;
  });

  private readonly _changedIris = new Set<string>();
  private readonly _cancel$ = new Subject<void>();

  isOpen(kind: string): boolean {
    return !this._folded().has(kind);
  }

  toggleGroup(kind: string) {
    this._folded.update(folded => {
      const next = new Set(folded);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }

  constructor() {
    this.form.controls.action.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.confirming.set(false));
    this._loadResources();
    this._followTarget();
    // The creation form adds and removes values itself; the checkbox follows how many there are.
    effect(() => {
      const count = this.valueCount();
      untracked(() => this._syncOnlyEmpty(count));
    });
  }

  apply(changes: BulkEditChange[]) {
    const target = this.target()!;
    this.running.set(changes);
    this.processed.set(0);
    this.succeeded.set([]);
    this.failed.set([]);
    this._dialogRef.disableClose = true;
    this.step.set('applying');

    // Plain text, list values and labels go to the batch route, 100 changes a request; the rest one by one.
    const batchable = changes.filter(change => batchChangeOf(change, target));
    const single = changes.filter(change => !batchChangeOf(change, target));
    const jobs: BulkEditChange[][] = [...batchesOf(batchable), ...single.map(change => [change])];

    from(jobs)
      .pipe(
        concatMap(job =>
          job.length === 1 && !batchChangeOf(job[0], target)
            ? this._writeOne(job[0], target)
            : this._writeBatch(job, target)
        ),
        takeUntil(this._cancel$),
        finalize(() => {
          this._dialogRef.disableClose = false;
          this.step.set('done');
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(outcomes => {
        this.processed.update(count => count + outcomes.length);
        const ok = outcomes.filter(outcome => outcome.ok).map(outcome => outcome.change);
        const failed = outcomes.filter(outcome => !outcome.ok).map(outcome => outcome.change);
        ok.forEach(change => this._changedIris.add(change.resource.id));
        this.succeeded.update(done => [...done, ...ok]);
        this.failed.update(done => [...done, ...failed]);
      });
  }

  cancelRemaining() {
    this._cancel$.next();
  }

  /** The written values changed the resources, so they are read again before the next edit. */
  editAgain() {
    this.running.set([]);
    this._loadResources();
  }

  close() {
    this._dialogRef.close([...this._changedIris]);
  }

  private _writeOne(change: BulkEditChange, target: BulkEditTarget): Observable<BulkEditOutcome[]> {
    return this._write(change, target).pipe(
      map(() => [{ change, ok: true }]),
      catchError(() => of([{ change, ok: false }]))
    );
  }

  /**
   * Applies up to 100 changes in one request; each gets its own result, so one refused change (a conflict,
   * missing rights) does not fail the others. A failed request fails them all, to be retried.
   */
  private _writeBatch(changes: BulkEditChange[], target: BulkEditTarget): Observable<BulkEditOutcome[]> {
    const body = { changes: changes.map(change => batchChangeOf(change, target)!) };
    return this._apiV3.postV3ResourcesValuesBatch(body as unknown as BatchChangesRequest).pipe(
      map(response => {
        const ok = new Set((response.results ?? []).filter(result => result.status === 'ok').map(r => r.index));
        return changes.map((change, index) => ({ change, ok: ok.has(index) }));
      }),
      catchError(() => of(changes.map(change => ({ change, ok: false }))))
    );
  }

  private _write(change: BulkEditChange, target: BulkEditTarget): Observable<unknown> {
    const request = bulkEditRequest(change, target);
    switch (request.kind) {
      case 'label':
        return this._dspApiConnection.v2.res.updateResourceMetadata(request.payload);
      case 'update':
        return this._dspApiConnection.v2.values.updateValue(request.payload);
      case 'create':
        return this._dspApiConnection.v2.values.createValue(request.payload);
      case 'delete':
        return this._dspApiConnection.v2.values.deleteValue(request.payload);
    }
  }

  /** Resets the values for the chosen property and loads the list of a list property. */
  private _followTarget() {
    this.form.controls.property.valueChanges
      .pipe(
        // The form's own value (and so target()) is updated only after this control emits.
        map(id => this.targets().find(target => target.id === id) ?? null),
        distinctUntilChanged((a, b) => a?.id === b?.id),
        switchMap(target => {
          this._resetValues(target);
          this.listOptions.set([]);
          this.listLoadFailed.set(false);
          if (target?.kind !== 'list') {
            return of([]);
          }
          return this._dspApiConnection.v2.list.getList(target.listRootIri).pipe(
            map(root => flattenList(root as ListNodeV2)),
            catchError(() => {
              this.listLoadFailed.set(true);
              return of([]);
            })
          );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(options => this.listOptions.set(options));
  }

  /**
   * A new property starts with one empty editor of its kind, as the creation form starts it, keeping the
   * plain text typed so far, and with “only update empty values” ticked.
   */
  private _resetValues(target: BulkEditTarget | null) {
    const { values, label, onlyEmpty } = this.form.controls;
    const typed = values.at(0)?.controls.item.value ?? label.value;
    values.clear({ emitEvent: false });
    if (target && target.kind !== 'label') {
      const item = propertiesTypeMapping.get(target.propertyDefinition.objectType!)!.control();
      if (target.kind === 'text' && typeof typed === 'string') {
        item.setValue(typed, { emitEvent: false });
      }
      values.push(new FormGroup({ item, comment: new FormControl<string | null>(null) }), { emitEvent: false });
    } else if (typeof typed === 'string') {
      label.setValue(typed, { emitEvent: false });
    }
    onlyEmpty.setValue(true, { emitEvent: false });
    // A property that can only be removed starts on removing, its one action; Apply still asks to confirm.
    // A required one can do neither, and says why under the toggle.
    const action = !target || canSet(target) ? 'set' : canRemove(target) ? 'remove' : null;
    this.form.controls.action.setValue(action, { emitEvent: false });
    this.confirming.set(false);
    this._syncOnlyEmpty(Math.max(1, values.length));
  }

  /** Locks the checkbox ticked while several values are typed, and frees it again for one. */
  private _syncOnlyEmpty(count: number) {
    const { onlyEmpty } = this.form.controls;
    // Several values can only fill empty properties: “also replace” is then disabled, so fall back.
    if (!canOverwrite(count) && !onlyEmpty.value) {
      onlyEmpty.setValue(true);
    }
  }

  /** The selection may be stale, so the plan is computed from freshly read resources. */
  private _loadResources() {
    this.step.set('loading');
    this.loadedCount.set(0);
    const chunks: string[][] = [];
    for (let i = 0; i < this.data.resourceIris.length; i += READ_CHUNK_SIZE) {
      chunks.push(this.data.resourceIris.slice(i, i + READ_CHUNK_SIZE));
    }

    // A few batches at a time; they may answer out of order, so they are put back in the selection's order.
    from(chunks.map((iris, index) => ({ iris, index })))
      .pipe(
        mergeMap(
          ({ iris, index }) =>
            this._dspApiConnection.v2.res.getResourcesBatch(iris).pipe(
              map(sequence => ({ index, resources: (sequence as ReadResourceSequence).resources })),
              tap(({ resources }) => this.loadedCount.update(count => count + resources.length))
            ),
          READ_CONCURRENCY
        ),
        toArray(),
        map(pages => pages.sort((a, b) => a.index - b.index).flatMap(page => page.resources)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: resources => {
          this._resources.set(resources);
          // The label comes first: every resource has one.
          const [preselected] = this.targets();
          if (preselected && !this.form.controls.property.value) {
            this.form.controls.property.setValue(preselected.id);
          }
          this.step.set('edit');
        },
        error: () => this.step.set('loadFailed'),
      });
  }

  private _labelOf(target: BulkEditTarget): string {
    if (target.kind === 'label') {
      return this._translateService.instant('pages.dataBrowser.bulkEdit.label');
    }
    const propDef: ResourcePropertyDefinition = target.propertyDefinition;
    if (propDef instanceof ResourcePropertyDefinitionWithAllLanguages && propDef.labels.length) {
      return this._stringifyStringLiteral.transform(propDef.labels);
    }
    return propDef.label ?? propDef.id;
  }
}

function _operationOf(
  target: BulkEditTarget,
  value: FormValue,
  listOptions: BulkEditListOption[]
): BulkEditSetOperation | null {
  if (target.kind === 'label') {
    const label = value.label.trim();
    return label ? { values: [{ content: label, display: label }], onlyEmpty: value.onlyEmpty } : null;
  }
  const seen = new Set<string>();
  const values: BulkEditNewValue[] = [];
  for (const { item, comment } of value.values) {
    const newValue = _newValueOf(target, item, listOptions);
    if (newValue && !seen.has(newValue.content)) {
      seen.add(newValue.content);
      values.push(comment?.trim() ? { ...newValue, comment: comment.trim() } : newValue);
    }
  }
  return values.length ? { values, onlyEmpty: value.onlyEmpty } : null;
}

/** An editor's value, or null while it is empty. */
function _newValueOf(
  target: BulkEditTarget,
  content: unknown,
  listOptions: BulkEditListOption[]
): BulkEditNewValue | null {
  if (typeof content !== 'string' || !content.trim()) {
    return null;
  }
  switch (target.kind) {
    case 'list':
      return { content, display: listOptions.find(option => option.id === content)?.path ?? content };
    case 'richText': {
      const display = richTextDisplay(content);
      return display ? { content, display } : null;
    }
    default:
      return { content, display: content };
  }
}
