import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOptgroup } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import {
  KnoraApiConnection,
  ListNodeV2,
  ReadResource,
  ReadResourceSequence,
  ResourcePropertyDefinition,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
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
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  toArray,
} from 'rxjs';
import {
  BulkEditChange,
  BulkEditListOption,
  BulkEditOperation,
  BulkEditPlan,
  bulkEditRequest,
  BulkEditTarget,
  bulkEditTargets,
  canOverwrite,
  flattenList,
  planBulkEdit,
} from './bulk-edit-plan';

export interface BulkEditDialogProps {
  resourceIris: string[];
  /** Which resources these are, e.g. what a search keeps; without it the panel names the selected count. */
  scope?: string;
}

/** The IRIs of the resources that got at least one value written. */
export type BulkEditDialogResult = string[];

type Step = 'loading' | 'loadFailed' | 'edit' | 'applying' | 'done';

interface FormValue {
  property: string | null;
  values: string[];
  listValues: (string | null)[];
  onlyEmpty: boolean;
}

const TARGET_GROUPS: { kind: BulkEditTarget['kind']; labelKey: string }[] = [
  { kind: 'label', labelKey: 'pages.dataBrowser.bulkEdit.groupResource' },
  { kind: 'text', labelKey: 'pages.dataBrowser.bulkEdit.groupText' },
  { kind: 'list', labelKey: 'pages.dataBrowser.bulkEdit.groupList' },
];

/** dsp-api reads at most this many resources in one request. */
const READ_CHUNK_SIZE = 25;

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

    <div class="body">
      @switch (step()) {
        @case ('loading') {
          <app-progress-indicator />
        }
        @case ('loadFailed') {
          <p class="error" data-cy="bulk-edit-load-failed">{{ 'pages.dataBrowser.bulkEdit.loadFailed' | translate }}</p>
        }
        @case ('edit') {
          @if (target(); as currentTarget) {
            <form [formGroup]="form" class="form">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>{{ 'pages.dataBrowser.bulkEdit.property' | translate }}</mat-label>
                <mat-icon matPrefix class="kind-icon">{{ kindIcons[currentTarget.kind] }}</mat-icon>
                <mat-select formControlName="property" data-cy="bulk-edit-property">
                  @for (group of targetGroups(); track group.kind) {
                    <mat-optgroup [label]="group.labelKey | translate">
                      @for (option of group.targets; track option.id) {
                        <mat-option [value]="option.id">{{ option.label }}</mat-option>
                      }
                    </mat-optgroup>
                  }
                </mat-select>
              </mat-form-field>

              @if (currentTarget.kind === 'label') {
                <p class="hint">{{ 'pages.dataBrowser.bulkEdit.setValueHint' | translate }}</p>
              }

              <div class="values">
                @if (isList()) {
                  @for (control of form.controls.listValues.controls; track control; let i = $index) {
                    <div class="value-row">
                      <ng-container
                        [ngTemplateOutlet]="listSelect"
                        [ngTemplateOutletContext]="{
                          control: control,
                          label: valueLabel(i),
                          cy: 'bulk-edit-list-value-' + i,
                        }" />
                      <ng-container [ngTemplateOutlet]="removeButton" [ngTemplateOutletContext]="{ index: i }" />
                    </div>
                  }
                } @else {
                  @for (control of form.controls.values.controls; track control; let i = $index) {
                    <div class="value-row">
                      <mat-form-field appearance="outline" subscriptSizing="dynamic">
                        <mat-label>{{ valueLabel(i) }}</mat-label>
                        <input matInput [formControl]="control" [attr.data-cy]="'bulk-edit-value-' + i" />
                      </mat-form-field>
                      <ng-container [ngTemplateOutlet]="removeButton" [ngTemplateOutletContext]="{ index: i }" />
                    </div>
                  }
                }
                @if (isMultiple()) {
                  <button mat-button type="button" class="add-value" data-cy="bulk-edit-add-value" (click)="addValue()">
                    <mat-icon>add</mat-icon>
                    {{ 'pages.dataBrowser.bulkEdit.addValue' | translate }}
                  </button>
                }
              </div>
              @if (currentTarget.kind !== 'label') {
                <!-- A disabled checkbox shows no tooltip of its own, so its wrapper carries it. -->
                <div
                  class="only-empty"
                  [matTooltip]="'pages.dataBrowser.bulkEdit.onlyEmptyMultipleTooltip' | translate"
                  [matTooltipDisabled]="!isMultiple()">
                  <mat-checkbox formControlName="onlyEmpty" data-cy="bulk-edit-only-empty">
                    {{ 'pages.dataBrowser.bulkEdit.onlyEmpty' | translate }}
                  </mat-checkbox>
                  <p class="hint">
                    {{
                      (isMultiple()
                        ? 'pages.dataBrowser.bulkEdit.onlyEmptyMultipleHint'
                        : 'pages.dataBrowser.bulkEdit.onlyEmptyHint'
                      ) | translate
                    }}
                  </p>
                </div>
                @if (overwriteCount()) {
                  <p class="warning" role="status" data-cy="bulk-edit-overwrite-warning">
                    <mat-icon aria-hidden="true">warning</mat-icon>
                    {{ 'pages.dataBrowser.bulkEdit.overwriteWarning' | translate: { count: overwriteCount() } }}
                  </p>
                }
              }
              @if (listLoadFailed()) {
                <p class="error" data-cy="bulk-edit-list-load-failed">
                  {{ 'pages.dataBrowser.bulkEdit.listLoadFailed' | translate }}
                </p>
              }
            </form>

            <ng-template #removeButton let-index="index">
              @if (valueCount() > 1) {
                <button
                  mat-icon-button
                  type="button"
                  [attr.aria-label]="'pages.dataBrowser.bulkEdit.removeValue' | translate: { index: index + 1 }"
                  [attr.data-cy]="'bulk-edit-remove-value-' + index"
                  (click)="removeValue(index)">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </ng-template>

            <ng-template #listSelect let-control="control" let-label="label" let-cy="cy">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="list-field">
                <mat-label>{{ label }}</mat-label>
                <mat-select [formControl]="control" [attr.data-cy]="cy">
                  <mat-select-trigger>{{ listOptionPath(control.value) }}</mat-select-trigger>
                  @for (option of listOptions(); track option.id) {
                    <mat-option [value]="option.id" [style.padding-left.px]="16 + option.depth * 20">
                      {{ option.label }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </ng-template>

            <section class="preview" [attr.aria-label]="'pages.dataBrowser.bulkEdit.preview' | translate">
              <div class="preview-header">
                <mat-icon aria-hidden="true">visibility</mat-icon>
                <span class="preview-title">{{ 'pages.dataBrowser.bulkEdit.preview' | translate }}</span>
                @if (plan(); as p) {
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
                  @for (group of previewGroups(); track group.resource.id) {
                    <div class="change" data-cy="bulk-edit-change">
                      <div class="label">{{ group.resource.label }}</div>
                      @for (change of group.changes; track $index) {
                        <div class="diff">
                          @if (change.before === null) {
                            <span class="empty">{{ 'pages.dataBrowser.bulkEdit.empty' | translate }}</span>
                          } @else {
                            <del [class.chip]="isList()">{{ change.before }}</del>
                          }
                          <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                          <ins [class.chip]="isList()">{{ change.after }}</ins>
                        </div>
                      }
                    </div>
                  } @empty {
                    <p class="note" data-cy="bulk-edit-nothing-to-change">
                      {{ 'pages.dataBrowser.bulkEdit.nothingToChange' | translate }}
                    </p>
                  }
                  @if (p.changes.length && p.unchangedCount) {
                    <p class="note">
                      {{ 'pages.dataBrowser.bulkEdit.unchangedCount' | translate: { count: p.unchangedCount } }}
                    </p>
                  }
                } @else {
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
              {{ 'pages.dataBrowser.bulkEdit.doneSummary' | translate: { updated: succeeded().length } }}
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
          <span class="footer-hint">{{ 'pages.dataBrowser.bulkEdit.liveHint' | translate }}</span>
          <button mat-button type="button" (click)="close()">{{ 'ui.common.actions.cancel' | translate }}</button>
          @if (target()) {
            <button
              mat-flat-button
              color="primary"
              type="button"
              data-cy="bulk-edit-apply"
              [disabled]="!plan()?.changes?.length"
              (click)="apply(plan()!.changes)">
              {{ 'pages.dataBrowser.bulkEdit.apply' | translate: { count: plan()?.changes?.length ?? 0 } }}
            </button>
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
      .form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: none;
      }
      .values {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .value-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .value-row mat-form-field {
        flex: 1;
        min-width: 0;
      }
      .add-value,
      .only-empty {
        align-self: flex-start;
      }
      .only-empty .hint {
        margin: 0 0 0 40px;
      }
      .warning {
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
      .kind-icon {
        padding: 0 4px 0 12px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .list-field {
        width: 100%;
      }
      .empty {
        font-style: italic;
        color: #9ca3af; /* $cool-gray-400 */
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
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOptgroup,
    MatOption,
    MatPrefix,
    MatProgressBar,
    MatSelect,
    MatSelectTrigger,
    MatTooltip,
    TranslatePipe,
    AppProgressIndicatorComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class BulkEditDialogComponent {
  readonly data = inject<BulkEditDialogProps>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject<MatDialogRef<BulkEditDialogComponent, BulkEditDialogResult>>(MatDialogRef);
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _stringifyStringLiteral = inject(StringifyStringLiteralPipe);
  private readonly _translateService = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly kindIcons: Record<BulkEditTarget['kind'], string> = { label: 'label', text: 'notes', list: 'account_tree' };

  readonly form = new FormGroup({
    property: new FormControl<string | null>(null),
    values: new FormArray([new FormControl('', { nonNullable: true })]),
    listValues: new FormArray([new FormControl<string | null>(null)]),
    onlyEmpty: new FormControl(true, { nonNullable: true }),
  });

  readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly step = signal<Step>('loading');
  private readonly _resources = signal<ReadResource[]>([]);
  readonly resourceCount = computed(() => this._resources().length);
  readonly targets = computed(() => {
    const [first] = this._resources();
    return first ? bulkEditTargets(first).map(target => ({ ...target, label: this._labelOf(target) })) : [];
  });
  readonly targetGroups = computed(() =>
    TARGET_GROUPS.map(group => ({
      ...group,
      targets: this.targets().filter(target => target.kind === group.kind),
    })).filter(group => group.targets.length)
  );
  readonly target = computed(() => this.targets().find(target => target.id === this.formValue().property) ?? null);
  readonly isList = computed(() => this.target()?.kind === 'list');
  readonly isMultiple = computed(() => {
    const target = this.target();
    return !!target && !canOverwrite(target);
  });
  readonly valueCount = computed(() => (this.isList() ? this.formValue().listValues : this.formValue().values).length);

  readonly listOptions = signal<BulkEditListOption[]>([]);
  readonly listLoadFailed = signal(false);

  /** Null until the form says what to change. */
  readonly plan = computed<BulkEditPlan | null>(() => {
    const target = this.target();
    const operation = target && _operationOf(target, this.formValue(), this.listOptions());
    return target && operation ? planBulkEdit(this._resources(), target, operation) : null;
  });
  readonly changedResourceCount = computed(
    () => new Set(this.plan()?.changes.map(change => change.resource.id) ?? []).size
  );
  /** The preview shows each resource once, with every value it gets. */
  readonly previewGroups = computed(() => {
    const groups = new Map<string, { resource: ReadResource; changes: BulkEditChange[] }>();
    for (const change of this.plan()?.changes ?? []) {
      const group = groups.get(change.resource.id) ?? { resource: change.resource, changes: [] };
      group.changes.push(change);
      groups.set(change.resource.id, group);
    }
    return [...groups.values()];
  });
  /** Values written over, so the user sees what is lost before applying. */
  readonly overwriteCount = computed(() =>
    this.target()?.kind === 'label' ? 0 : (this.plan()?.changes.filter(change => change.value).length ?? 0)
  );

  readonly running = signal<BulkEditChange[]>([]);
  readonly processed = signal(0);
  readonly succeeded = signal<BulkEditChange[]>([]);
  readonly failed = signal<BulkEditChange[]>([]);
  readonly progress = computed(() => (this.running().length ? (this.processed() / this.running().length) * 100 : 0));
  readonly skippedCount = computed(() => (this.step() === 'done' ? this.running().length - this.processed() : 0));
  readonly summary = computed(
    () => `${this.target()?.label ?? ''} · ${this._translateService.instant('pages.dataBrowser.bulkEdit.setValue')}`
  );

  private readonly _changedIris = new Set<string>();
  private readonly _cancel$ = new Subject<void>();

  constructor() {
    this._loadResources();
    this._followTarget();
  }

  listOptionPath(id: string | null): string {
    return this.listOptions().find(option => option.id === id)?.path ?? '';
  }

  /** Numbered once the property takes several values. */
  valueLabel(index: number): string {
    return this.isMultiple()
      ? this._translateService.instant('pages.dataBrowser.bulkEdit.valueNumbered', { index: index + 1 })
      : this._translateService.instant('pages.dataBrowser.bulkEdit.value');
  }

  addValue() {
    if (this.isList()) {
      this.form.controls.listValues.push(new FormControl<string | null>(null));
    } else {
      this.form.controls.values.push(new FormControl('', { nonNullable: true }));
    }
  }

  removeValue(index: number) {
    (this.isList() ? this.form.controls.listValues : this.form.controls.values).removeAt(index);
  }

  apply(changes: BulkEditChange[]) {
    const target = this.target()!;
    this.running.set(changes);
    this.processed.set(0);
    this.succeeded.set([]);
    this.failed.set([]);
    this._dialogRef.disableClose = true;
    this.step.set('applying');

    from(changes)
      .pipe(
        concatMap(change =>
          this._write(change, target).pipe(
            map(() => ({ change, ok: true })),
            catchError(() => of({ change, ok: false }))
          )
        ),
        takeUntil(this._cancel$),
        finalize(() => {
          this._dialogRef.disableClose = false;
          this.step.set('done');
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(({ change, ok }) => {
        this.processed.update(count => count + 1);
        if (ok) {
          this._changedIris.add(change.resource.id);
          this.succeeded.update(done => [...done, change]);
        } else {
          this.failed.update(done => [...done, change]);
        }
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

  private _write(change: BulkEditChange, target: BulkEditTarget): Observable<unknown> {
    const request = bulkEditRequest(change, target);
    switch (request.kind) {
      case 'label':
        return this._dspApiConnection.v2.res.updateResourceMetadata(request.payload);
      case 'update':
        return this._dspApiConnection.v2.values.updateValue(request.payload);
      case 'create':
        return this._dspApiConnection.v2.values.createValue(request.payload);
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
   * A new property starts with one value field, keeping the text typed so far. A property with several
   * values per resource is only ever filled where empty, so its checkbox stays ticked and disabled.
   */
  private _resetValues(target: BulkEditTarget | null) {
    const { values, listValues, onlyEmpty } = this.form.controls;
    const typed = values.at(0).value;
    values.clear({ emitEvent: false });
    values.push(new FormControl(typed, { nonNullable: true }), { emitEvent: false });
    listValues.clear({ emitEvent: false });
    listValues.push(new FormControl<string | null>(null), { emitEvent: false });
    onlyEmpty.setValue(true, { emitEvent: false });
    if (target && !canOverwrite(target)) {
      onlyEmpty.disable();
    } else {
      onlyEmpty.enable();
    }
  }

  /** The selection may be stale, so the plan is computed from freshly read resources. */
  private _loadResources() {
    this.step.set('loading');
    const chunks: string[][] = [];
    for (let i = 0; i < this.data.resourceIris.length; i += READ_CHUNK_SIZE) {
      chunks.push(this.data.resourceIris.slice(i, i + READ_CHUNK_SIZE));
    }

    from(chunks)
      .pipe(
        concatMap(iris => this._dspApiConnection.v2.res.getResources(iris)),
        map(sequence => (sequence as ReadResourceSequence).resources),
        toArray(),
        map(pages => pages.flat()),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: resources => {
          this._resources.set(resources);
          // A property is preselected rather than the label, which matters more to get wrong.
          const preselected = this.targets().find(target => target.kind !== 'label') ?? this.targets()[0];
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
): BulkEditOperation | null {
  if (target.kind === 'list') {
    const ids = new Set(value.listValues.filter((id): id is string => !!id));
    const values = listOptions.filter(option => ids.has(option.id));
    return values.length ? { kind: 'setListValue', values, onlyEmpty: value.onlyEmpty } : null;
  }
  const values = [...new Set(value.values.filter(text => text.trim()))];
  return values.length ? { kind: 'setValue', values, onlyEmpty: value.onlyEmpty } : null;
}
