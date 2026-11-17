import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
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
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
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

type Step = 'loading' | 'loadFailed' | 'edit' | 'review' | 'applying' | 'done';

/** dsp-api reads at most this many resources in one request. */
const READ_CHUNK_SIZE = 25;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bulk-edit-dialog',
  template: `
    <app-dialog-header
      [title]="'pages.dataBrowser.bulkEdit.title' | translate"
      [subtitle]="'pages.dataBrowser.bulkEdit.subtitle' | translate: { count: data.resourceIris.length }" />

    <mat-dialog-content>
      @switch (step()) {
        @case ('loading') {
          <app-progress-indicator />
        }
        @case ('loadFailed') {
          <p class="message error" data-cy="bulk-edit-load-failed">
            {{ 'pages.dataBrowser.bulkEdit.loadFailed' | translate }}
          </p>
        }
        @case ('edit') {
          @if (properties().length === 0) {
            <p class="message" data-cy="bulk-edit-no-properties">
              {{ 'pages.dataBrowser.bulkEdit.noProperties' | translate }}
            </p>
          } @else {
            <form [formGroup]="form" class="form">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'pages.dataBrowser.bulkEdit.property' | translate }}</mat-label>
                <mat-select formControlName="property" data-cy="bulk-edit-property">
                  @for (property of properties(); track property.id) {
                    <mat-option [value]="property.id">{{ property.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-radio-group formControlName="operation" class="operations" data-cy="bulk-edit-operation">
                @for (operation of operations; track operation.kind) {
                  <mat-radio-button [value]="operation.kind" [attr.data-cy]="'bulk-edit-operation-' + operation.kind">
                    <span class="operation-label">{{ operation.labelKey | translate }}</span>
                    <span class="operation-hint">{{ operation.hintKey | translate }}</span>
                  </mat-radio-button>
                }
              </mat-radio-group>

              @switch (formValue().operation) {
                @case ('addText') {
                  <div class="row">
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'pages.dataBrowser.bulkEdit.text' | translate }}</mat-label>
                      <input matInput formControlName="text" data-cy="bulk-edit-text" />
                    </mat-form-field>
                    <mat-radio-group formControlName="position" class="inline-options">
                      <mat-radio-button value="before">
                        {{ 'pages.dataBrowser.bulkEdit.positionBefore' | translate }}
                      </mat-radio-button>
                      <mat-radio-button value="after">
                        {{ 'pages.dataBrowser.bulkEdit.positionAfter' | translate }}
                      </mat-radio-button>
                    </mat-radio-group>
                  </div>
                }
                @case ('replace') {
                  <div class="row">
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'pages.dataBrowser.bulkEdit.find' | translate }}</mat-label>
                      <input matInput formControlName="find" data-cy="bulk-edit-find" />
                    </mat-form-field>
                    <mat-icon aria-hidden="true" class="arrow">arrow_forward</mat-icon>
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'pages.dataBrowser.bulkEdit.replaceWith' | translate }}</mat-label>
                      <input matInput formControlName="replaceWith" data-cy="bulk-edit-replace-with" />
                    </mat-form-field>
                  </div>
                  <div class="inline-options">
                    <mat-checkbox formControlName="wholeValue">
                      {{ 'pages.dataBrowser.bulkEdit.wholeValue' | translate }}
                    </mat-checkbox>
                    <mat-checkbox formControlName="matchCase">
                      {{ 'pages.dataBrowser.bulkEdit.matchCase' | translate }}
                    </mat-checkbox>
                  </div>
                }
                @case ('defaultValue') {
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'pages.dataBrowser.bulkEdit.value' | translate }}</mat-label>
                    <input matInput formControlName="text" data-cy="bulk-edit-default-value" />
                  </mat-form-field>
                }
              }
            </form>
          }
        }
        @case ('review') {
          @let p = plan()!;
          @if (p.changes.length === 0) {
            <p class="message" data-cy="bulk-edit-nothing-to-change">
              {{ 'pages.dataBrowser.bulkEdit.nothingToChange' | translate }}
            </p>
          } @else {
            <p class="message" data-cy="bulk-edit-review-summary">
              {{
                'pages.dataBrowser.bulkEdit.reviewSummary'
                  | translate
                    : { changes: p.changes.length, resources: changedResourceCount(), unchanged: p.unchangedCount }
              }}
            </p>
            <div class="changes" role="table">
              <div class="change header" role="row">
                <span role="columnheader">{{ 'pages.dataBrowser.bulkEdit.resource' | translate }}</span>
                <span role="columnheader">{{ 'pages.dataBrowser.bulkEdit.before' | translate }}</span>
                <span role="columnheader">{{ 'pages.dataBrowser.bulkEdit.after' | translate }}</span>
              </div>
              @for (change of p.changes; track $index) {
                <div class="change" role="row" data-cy="bulk-edit-change">
                  <span role="cell" class="label">{{ change.resource.label }}</span>
                  <span role="cell">
                    @if (change.before === null) {
                      <span class="empty">{{ 'pages.dataBrowser.bulkEdit.empty' | translate }}</span>
                    } @else {
                      <del>{{ change.before }}</del>
                    }
                  </span>
                  <span role="cell"
                    ><ins>{{ change.after }}</ins></span
                  >
                </div>
              }
            </div>
          }
        }
        @case ('applying') {
          <p class="message">
            {{
              'pages.dataBrowser.bulkEdit.applying' | translate: { done: processed(), total: plan()!.changes.length }
            }}
          </p>
          <mat-progress-bar mode="determinate" [value]="(processed() / plan()!.changes.length) * 100" />
        }
        @case ('done') {
          <p class="message" data-cy="bulk-edit-done">
            {{ 'pages.dataBrowser.bulkEdit.doneSummary' | translate: { updated: succeeded().length } }}
          </p>
          @if (failed().length) {
            <p class="message error" data-cy="bulk-edit-failed">
              {{ 'pages.dataBrowser.bulkEdit.failedSummary' | translate: { failed: failed().length } }}
            </p>
            <ul class="failed-list">
              @for (change of failed(); track $index) {
                <li>{{ change.resource.label }}: {{ change.after }}</li>
              }
            </ul>
          }
          @if (skippedCount()) {
            <p class="message">
              {{ 'pages.dataBrowser.bulkEdit.cancelledSummary' | translate: { skipped: skippedCount() } }}
            </p>
          }
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @switch (step()) {
        @case ('edit') {
          <button mat-button type="button" (click)="close()">{{ 'ui.common.actions.cancel' | translate }}</button>
          @if (properties().length) {
            <button
              mat-flat-button
              color="primary"
              type="button"
              data-cy="bulk-edit-review"
              [disabled]="!canReview()"
              (click)="review()">
              {{ 'pages.dataBrowser.bulkEdit.reviewChanges' | translate }}
            </button>
          }
        }
        @case ('review') {
          <button mat-button type="button" (click)="step.set('edit')">
            {{ 'ui.common.actions.back' | translate }}
          </button>
          <button
            mat-flat-button
            color="primary"
            type="button"
            data-cy="bulk-edit-apply"
            [disabled]="plan()!.changes.length === 0"
            (click)="apply()">
            {{ 'pages.dataBrowser.bulkEdit.apply' | translate: { count: plan()!.changes.length } }}
          </button>
        }
        @case ('applying') {
          <button mat-button type="button" data-cy="bulk-edit-cancel-remaining" (click)="cancelRemaining()">
            {{ 'pages.dataBrowser.bulkEdit.cancelRemaining' | translate }}
          </button>
        }
        @default {
          <button mat-flat-button color="primary" type="button" data-cy="bulk-edit-close" (click)="close()">
            {{ 'ui.common.actions.close' | translate }}
          </button>
        }
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 560px;
      }
      .operations {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }
      .operation-label {
        font-weight: 500;
      }
      .operation-hint {
        color: #6b7280; /* $cool-gray-500 */
        margin-left: 8px;
      }
      .row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      .arrow {
        margin-top: 16px;
        color: #9ca3af; /* $cool-gray-400 */
      }
      .inline-options {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .message {
        margin: 0 0 12px;
      }
      .error {
        color: #b9193c; /* $red-800 */
      }
      .changes {
        max-height: 50vh;
        overflow: auto;
        border: 1px solid #e5e7eb; /* $cool-gray-200 */
        border-radius: 4px;
      }
      .change {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
        padding: 8px 12px;
        border-bottom: 1px solid #f3f4f6; /* $cool-gray-100 */
      }
      .change.header {
        position: sticky;
        top: 0;
        background: #f9fafb; /* $cool-gray-50 */
        font-weight: 500;
      }
      .label {
        font-weight: 500;
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
        color: #9ca3af; /* $cool-gray-400 */
      }
      .failed-list {
        max-height: 30vh;
        overflow: auto;
      }
    `,
  ],
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatDialogActions,
    MatDialogContent,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatOption,
    MatProgressBar,
    MatRadioButton,
    MatRadioGroup,
    MatSelect,
    TranslatePipe,
    AppProgressIndicatorComponent,
    DialogHeaderComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class BulkEditDialogComponent {
  readonly data = inject<BulkEditDialogProps>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject<MatDialogRef<BulkEditDialogComponent, BulkEditDialogResult>>(MatDialogRef);
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _stringifyStringLiteral = inject(StringifyStringLiteralPipe);
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

  readonly step = signal<Step>('loading');
  private readonly _resources = signal<ReadResource[]>([]);
  readonly properties = computed(() => {
    const [first] = this._resources();
    return first
      ? bulkEditableProperties(first).map(propDef => ({ id: propDef.id, label: this._labelOf(propDef) }))
      : [];
  });

  readonly canReview = computed(() => {
    const value = this.formValue();
    if (!value.property) return false;
    return value.operation === 'replace' ? value.find !== '' : value.text !== '';
  });

  readonly plan = signal<BulkEditPlan | null>(null);
  readonly changedResourceCount = computed(
    () => new Set(this.plan()?.changes.map(change => change.resource.id) ?? []).size
  );

  readonly processed = signal(0);
  readonly succeeded = signal<BulkEditChange[]>([]);
  readonly failed = signal<BulkEditChange[]>([]);
  readonly skippedCount = computed(() =>
    this.step() === 'done' ? (this.plan()?.changes.length ?? 0) - this.processed() : 0
  );
  private readonly _cancel$ = new Subject<void>();

  constructor() {
    this._loadResources();
  }

  review() {
    const value = this.form.getRawValue();
    this.plan.set(planBulkEdit(this._resources(), value.property!, this._operation()));
    this.step.set('review');
  }

  apply() {
    const plan = this.plan()!;
    const propertyIri = this.form.getRawValue().property!;
    this._dialogRef.disableClose = true;
    this.step.set('applying');

    from(plan.changes)
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
        (ok ? this.succeeded : this.failed).update(changes => [...changes, change]);
      });
  }

  cancelRemaining() {
    this._cancel$.next();
  }

  close() {
    this._dialogRef.close([...new Set(this.succeeded().map(change => change.resource.id))]);
  }

  private _operation(): BulkEditOperation {
    const value = this.form.getRawValue();
    switch (value.operation) {
      case 'addText':
        return { kind: 'addText', text: value.text, position: value.position };
      case 'replace':
        return {
          kind: 'replace',
          find: value.find,
          replaceWith: value.replaceWith,
          wholeValue: value.wholeValue,
          matchCase: value.matchCase,
        };
      case 'defaultValue':
        return { kind: 'defaultValue', text: value.text };
    }
  }

  private _write(change: BulkEditChange, propertyIri: string): Observable<unknown> {
    const request = bulkEditRequest(change, propertyIri);
    return request.kind === 'update'
      ? this._dspApiConnection.v2.values.updateValue(request.payload)
      : this._dspApiConnection.v2.values.createValue(request.payload);
  }

  /** The selection may be stale, so the plan is computed from freshly read resources. */
  private _loadResources() {
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
          if (first) {
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
