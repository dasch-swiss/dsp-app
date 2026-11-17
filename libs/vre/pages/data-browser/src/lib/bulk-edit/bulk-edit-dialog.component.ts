import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  KnoraApiConnection,
  ReadResource,
  ReadResourceSequence,
  ResourcePropertyDefinition,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, concatMap, finalize, from, map, Observable, of, Subject, takeUntil, toArray } from 'rxjs';
import {
  BulkEditChange,
  bulkEditableProperties,
  BulkEditOperation,
  BulkEditPlan,
  bulkEditRequest,
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
  operation: BulkEditOperation['kind'];
  text: string;
  position: 'before' | 'after';
  find: string;
  replaceWith: string;
  wholeValue: boolean;
  matchCase: boolean;
}

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
          @if (properties().length === 0) {
            <p data-cy="bulk-edit-no-properties">{{ 'pages.dataBrowser.bulkEdit.noProperties' | translate }}</p>
          } @else {
            <form [formGroup]="form" class="form">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>{{ 'pages.dataBrowser.bulkEdit.property' | translate }}</mat-label>
                <mat-select formControlName="property" data-cy="bulk-edit-property">
                  @for (property of properties(); track property.id) {
                    <mat-option [value]="property.id">{{ property.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div>
                <mat-button-toggle-group
                  formControlName="operation"
                  class="operations"
                  hideSingleSelectionIndicator
                  [attr.aria-label]="'pages.dataBrowser.bulkEdit.operation' | translate">
                  @for (operation of operations; track operation.kind) {
                    <mat-button-toggle
                      [value]="operation.kind"
                      [attr.data-cy]="'bulk-edit-operation-' + operation.kind">
                      {{ operation.labelKey | translate }}
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
              }
            </form>

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
                          <del>{{ change.before }}</del>
                        }
                        <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                        <ins>{{ change.after }}</ins>
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
          @if (properties().length) {
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
    MatOption,
    MatProgressBar,
    MatSelect,
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

  readonly operations = [
    {
      kind: 'addText',
      labelKey: 'pages.dataBrowser.bulkEdit.addText',
      hintKey: 'pages.dataBrowser.bulkEdit.addTextHint',
    },
    {
      kind: 'replace',
      labelKey: 'pages.dataBrowser.bulkEdit.replace',
      hintKey: 'pages.dataBrowser.bulkEdit.replaceHint',
    },
    {
      kind: 'defaultValue',
      labelKey: 'pages.dataBrowser.bulkEdit.defaultValue',
      hintKey: 'pages.dataBrowser.bulkEdit.defaultValueHint',
    },
  ] as const;

  readonly form = new FormGroup({
    property: new FormControl<string | null>(null),
    operation: new FormControl<BulkEditOperation['kind']>('replace', { nonNullable: true }),
    text: new FormControl('', { nonNullable: true }),
    position: new FormControl<'before' | 'after'>('after', { nonNullable: true }),
    find: new FormControl('', { nonNullable: true }),
    replaceWith: new FormControl('', { nonNullable: true }),
    wholeValue: new FormControl(false, { nonNullable: true }),
    matchCase: new FormControl(false, { nonNullable: true }),
  });

  readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly operationHintKey = computed(
    () => this.operations.find(operation => operation.kind === this.formValue().operation)!.hintKey
  );

  readonly step = signal<Step>('loading');
  private readonly _resources = signal<ReadResource[]>([]);
  readonly resourceCount = computed(() => this._resources().length);
  readonly properties = computed(() => {
    const [first] = this._resources();
    return first
      ? bulkEditableProperties(first).map(propDef => ({ id: propDef.id, label: this._labelOf(propDef) }))
      : [];
  });

  /** Null until the form says what to change. */
  readonly plan = computed<BulkEditPlan | null>(() => {
    const value = this.formValue();
    const operation = _operationOf(value);
    return value.property && operation ? planBulkEdit(this._resources(), value.property, operation) : null;
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
    const property = this.properties().find(prop => prop.id === this.formValue().property);
    const operation = this.operations.find(op => op.kind === this.formValue().operation)!;
    return `${property?.label ?? ''} · ${this._translateService.instant(operation.labelKey)}`;
  });

  private readonly _changedIris = new Set<string>();
  private readonly _cancel$ = new Subject<void>();

  constructor() {
    this._loadResources();
  }

  apply(changes: BulkEditChange[]) {
    const propertyIri = this.form.getRawValue().property!;
    this.running.set(changes);
    this.processed.set(0);
    this.succeeded.set([]);
    this.failed.set([]);
    this._dialogRef.disableClose = true;
    this.step.set('applying');

    from(changes)
      .pipe(
        concatMap(change =>
          this._write(change, propertyIri).pipe(
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

  private _write(change: BulkEditChange, propertyIri: string): Observable<unknown> {
    const request = bulkEditRequest(change, propertyIri);
    return request.kind === 'update'
      ? this._dspApiConnection.v2.values.updateValue(request.payload)
      : this._dspApiConnection.v2.values.createValue(request.payload);
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
          const [first] = this.properties();
          if (first && !this.form.controls.property.value) {
            this.form.controls.property.setValue(first.id);
          }
          this.step.set('edit');
        },
        error: () => this.step.set('loadFailed'),
      });
  }

  private _labelOf(propDef: ResourcePropertyDefinition): string {
    if (propDef instanceof ResourcePropertyDefinitionWithAllLanguages && propDef.labels.length) {
      return this._stringifyStringLiteral.transform(propDef.labels);
    }
    return propDef.label ?? propDef.id;
  }
}

function _operationOf(value: FormValue): BulkEditOperation | null {
  switch (value.operation) {
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
