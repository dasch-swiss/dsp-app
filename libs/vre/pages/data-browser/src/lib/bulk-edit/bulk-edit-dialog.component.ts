import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOptgroup } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
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
  BULK_EDIT_OPERATIONS,
  BulkEditChange,
  BulkEditListOption,
  BulkEditOperation,
  BulkEditOperationKind,
  BulkEditPlan,
  bulkEditRequest,
  BulkEditTarget,
  bulkEditTargets,
  flattenList,
  planBulkEdit,
} from './bulk-edit-plan';

export interface BulkEditDialogProps {
  resourceIris: string[];
}

/** The IRIs of the resources that got at least one value written. */
export type BulkEditDialogResult = string[];

type Step = 'loading' | 'loadFailed' | 'edit' | 'applying' | 'done';

interface FormValue {
  property: string | null;
  operation: BulkEditOperationKind;
  text: string;
  position: 'before' | 'after';
  find: string;
  replaceWith: string;
  wholeValue: boolean;
  matchCase: boolean;
  listFrom: string | null;
  listTo: string | null;
}

const OPERATION_INFO: Record<BulkEditOperationKind, { labelKey: string; hintKey: string }> = {
  addText: { labelKey: 'pages.dataBrowser.bulkEdit.addText', hintKey: 'pages.dataBrowser.bulkEdit.addTextHint' },
  replace: { labelKey: 'pages.dataBrowser.bulkEdit.replace', hintKey: 'pages.dataBrowser.bulkEdit.replaceHint' },
  setValue: { labelKey: 'pages.dataBrowser.bulkEdit.setValue', hintKey: 'pages.dataBrowser.bulkEdit.setValueHint' },
  defaultValue: {
    labelKey: 'pages.dataBrowser.bulkEdit.defaultValue',
    hintKey: 'pages.dataBrowser.bulkEdit.defaultValueHint',
  },
  replaceListValue: {
    labelKey: 'pages.dataBrowser.bulkEdit.replace',
    hintKey: 'pages.dataBrowser.bulkEdit.replaceListValueHint',
  },
  setListValue: {
    labelKey: 'pages.dataBrowser.bulkEdit.setValue',
    hintKey: 'pages.dataBrowser.bulkEdit.setListValueHint',
  },
  defaultListValue: {
    labelKey: 'pages.dataBrowser.bulkEdit.defaultValue',
    hintKey: 'pages.dataBrowser.bulkEdit.defaultListValueHint',
  },
};

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
      <div class="heading">
        <h2 class="mat-headline-6 title">{{ 'pages.dataBrowser.bulkEdit.title' | translate }}</h2>
        <p class="subtitle">
          {{ 'pages.dataBrowser.bulkEdit.subtitle' | translate: { count: data.resourceIris.length } }}
        </p>
      </div>
      <button
        mat-icon-button
        type="button"
        [disabled]="step() === 'applying'"
        [attr.aria-label]="'ui.common.actions.close' | translate"
        (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
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

              <div>
                <mat-button-toggle-group
                  formControlName="operation"
                  class="operations"
                  hideSingleSelectionIndicator
                  [attr.aria-label]="'pages.dataBrowser.bulkEdit.operation' | translate">
                  @for (operation of operations(); track operation) {
                    <mat-button-toggle [value]="operation" [attr.data-cy]="'bulk-edit-operation-' + operation">
                      {{ operationInfo[operation].labelKey | translate }}
                    </mat-button-toggle>
                  }
                </mat-button-toggle-group>
                <p class="hint">{{ operationHintKey() | translate }}</p>
              </div>

              @switch (formValue().operation) {
                @case ('addText') {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>{{ 'pages.dataBrowser.bulkEdit.text' | translate }}</mat-label>
                    <input matInput formControlName="text" data-cy="bulk-edit-text" />
                  </mat-form-field>
                  <mat-button-toggle-group formControlName="position" hideSingleSelectionIndicator>
                    <mat-button-toggle value="before">
                      {{ 'pages.dataBrowser.bulkEdit.positionBefore' | translate }}
                    </mat-button-toggle>
                    <mat-button-toggle value="after">
                      {{ 'pages.dataBrowser.bulkEdit.positionAfter' | translate }}
                    </mat-button-toggle>
                  </mat-button-toggle-group>
                }
                @case ('replace') {
                  <div class="row">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>{{ 'pages.dataBrowser.bulkEdit.find' | translate }}</mat-label>
                      <input matInput formControlName="find" data-cy="bulk-edit-find" />
                    </mat-form-field>
                    <mat-icon aria-hidden="true" class="arrow">arrow_forward</mat-icon>
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>{{ 'pages.dataBrowser.bulkEdit.replaceWith' | translate }}</mat-label>
                      <input matInput formControlName="replaceWith" data-cy="bulk-edit-replace-with" />
                    </mat-form-field>
                  </div>
                  <div class="options">
                    <mat-checkbox formControlName="wholeValue">
                      {{ 'pages.dataBrowser.bulkEdit.wholeValue' | translate }}
                    </mat-checkbox>
                    <mat-checkbox formControlName="matchCase">
                      {{ 'pages.dataBrowser.bulkEdit.matchCase' | translate }}
                    </mat-checkbox>
                  </div>
                }
                @case ('defaultValue') {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>{{ 'pages.dataBrowser.bulkEdit.value' | translate }}</mat-label>
                    <input matInput formControlName="text" data-cy="bulk-edit-default-value" />
                  </mat-form-field>
                }
                @case ('setValue') {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>{{ 'pages.dataBrowser.bulkEdit.value' | translate }}</mat-label>
                    <input matInput formControlName="text" data-cy="bulk-edit-set-value" />
                  </mat-form-field>
                }
                @case ('replaceListValue') {
                  <div class="row">
                    <ng-container
                      [ngTemplateOutlet]="listSelect"
                      [ngTemplateOutletContext]="{
                        control: form.controls.listFrom,
                        labelKey: 'pages.dataBrowser.bulkEdit.listFrom',
                        cy: 'bulk-edit-list-from',
                      }" />
                    <mat-icon aria-hidden="true" class="arrow">arrow_forward</mat-icon>
                    <ng-container
                      [ngTemplateOutlet]="listSelect"
                      [ngTemplateOutletContext]="{
                        control: form.controls.listTo,
                        labelKey: 'pages.dataBrowser.bulkEdit.listTo',
                        cy: 'bulk-edit-list-to',
                      }" />
                  </div>
                }
                @default {
                  <ng-container
                    [ngTemplateOutlet]="listSelect"
                    [ngTemplateOutletContext]="{
                      control: form.controls.listTo,
                      labelKey: 'pages.dataBrowser.bulkEdit.value',
                      cy: 'bulk-edit-list-value',
                    }" />
                }
              }
              @if (listLoadFailed()) {
                <p class="error" data-cy="bulk-edit-list-load-failed">
                  {{ 'pages.dataBrowser.bulkEdit.listLoadFailed' | translate }}
                </p>
              }
            </form>

            <ng-template #listSelect let-control="control" let-labelKey="labelKey" let-cy="cy">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="list-field">
                <mat-label>{{ labelKey | translate }}</mat-label>
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
                  @for (change of p.changes; track $index) {
                    <div class="change" data-cy="bulk-edit-change">
                      <div class="label">{{ change.resource.label }}</div>
                      <div class="diff">
                        @if (change.before === null) {
                          <span class="empty">{{ 'pages.dataBrowser.bulkEdit.empty' | translate }}</span>
                        } @else {
                          <del [class.chip]="isList()">{{ change.before }}</del>
                        }
                        <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                        <ins [class.chip]="isList()">{{ change.after }}</ins>
                      </div>
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
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 16px 8px 12px 24px;
        border-bottom: 1px solid #e5e7eb; /* $cool-gray-200 */
      }
      .heading {
        flex: 1;
        min-width: 0;
      }
      .title {
        margin: 0;
      }
      .subtitle {
        margin: 2px 0 0;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
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
      .operations {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .hint {
        margin: 6px 0 0;
        font-size: 13px;
        color: #6b7280; /* $cool-gray-500 */
      }
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .row mat-form-field {
        flex: 1;
        min-width: 0;
      }
      .arrow {
        color: #9ca3af; /* $cool-gray-400 */
      }
      .options {
        display: flex;
        gap: 16px;
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
      .diff {
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
    MatButtonToggle,
    MatButtonToggleGroup,
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

  readonly operationInfo = OPERATION_INFO;
  readonly kindIcons: Record<BulkEditTarget['kind'], string> = { label: 'label', text: 'notes', list: 'account_tree' };

  readonly form = new FormGroup({
    property: new FormControl<string | null>(null),
    operation: new FormControl<BulkEditOperationKind>('replace', { nonNullable: true }),
    text: new FormControl('', { nonNullable: true }),
    position: new FormControl<'before' | 'after'>('after', { nonNullable: true }),
    find: new FormControl('', { nonNullable: true }),
    replaceWith: new FormControl('', { nonNullable: true }),
    wholeValue: new FormControl(false, { nonNullable: true }),
    matchCase: new FormControl(false, { nonNullable: true }),
    listFrom: new FormControl<string | null>(null),
    listTo: new FormControl<string | null>(null),
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
  readonly operations = computed(() => BULK_EDIT_OPERATIONS[this.target()?.kind ?? 'text']);
  readonly operationHintKey = computed(() => OPERATION_INFO[this.formValue().operation].hintKey);

  readonly listOptions = signal<BulkEditListOption[]>([]);
  readonly listLoadFailed = signal(false);

  /** Null until the form says what to change. */
  readonly plan = computed<BulkEditPlan | null>(() => {
    const target = this.target();
    const operation = _operationOf(this.formValue(), this.listOptions());
    return target && operation ? planBulkEdit(this._resources(), target, operation) : null;
  });
  readonly changedResourceCount = computed(
    () => new Set(this.plan()?.changes.map(change => change.resource.id) ?? []).size
  );

  readonly running = signal<BulkEditChange[]>([]);
  readonly processed = signal(0);
  readonly succeeded = signal<BulkEditChange[]>([]);
  readonly failed = signal<BulkEditChange[]>([]);
  readonly progress = computed(() => (this.running().length ? (this.processed() / this.running().length) * 100 : 0));
  readonly skippedCount = computed(() => (this.step() === 'done' ? this.running().length - this.processed() : 0));
  readonly summary = computed(() => {
    const operation = OPERATION_INFO[this.formValue().operation];
    return `${this.target()?.label ?? ''} · ${this._translateService.instant(operation.labelKey)}`;
  });

  private readonly _changedIris = new Set<string>();
  private readonly _cancel$ = new Subject<void>();

  constructor() {
    this._loadResources();
    this._followTarget();
  }

  listOptionPath(id: string | null): string {
    return this.listOptions().find(option => option.id === id)?.path ?? '';
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

  /** Keeps the operation valid for the chosen property and loads the list of a list property. */
  private _followTarget() {
    this.form.controls.property.valueChanges
      .pipe(
        // The form's own value (and so target()) is updated only after this control emits.
        map(id => this.targets().find(target => target.id === id) ?? null),
        distinctUntilChanged((a, b) => a?.id === b?.id),
        switchMap(target => {
          const operations = BULK_EDIT_OPERATIONS[target?.kind ?? 'text'];
          if (!operations.includes(this.form.controls.operation.value)) {
            this.form.controls.operation.setValue(operations[target?.kind === 'list' ? 0 : 1]);
          }
          this.form.patchValue({ listFrom: null, listTo: null });
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

function _operationOf(value: FormValue, listOptions: BulkEditListOption[]): BulkEditOperation | null {
  const to = listOptions.find(option => option.id === value.listTo);
  switch (value.operation) {
    case 'setValue':
      return value.text.trim() ? { kind: 'setValue', text: value.text } : null;
    case 'replaceListValue':
      return value.listFrom && to ? { kind: 'replaceListValue', from: value.listFrom, to } : null;
    case 'setListValue':
      return to ? { kind: 'setListValue', to } : null;
    case 'defaultListValue':
      return to ? { kind: 'defaultListValue', to } : null;
    case 'addText':
      return value.text ? { kind: 'addText', text: value.text, position: value.position } : null;
    case 'replace':
      return value.find
        ? {
            kind: 'replace',
            find: value.find,
            replaceWith: value.replaceWith,
            wholeValue: value.wholeValue,
            matchCase: value.matchCase,
          }
        : null;
    case 'defaultValue':
      return value.text ? { kind: 'defaultValue', text: value.text } : null;
  }
}
