import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { CanDo, injectDataModelEditing } from './data-model-editor';
import { classDeleteBlockers, DeleteBlocker, propertyDeleteBlockers } from './delete-blockers';

export interface DeleteBlockersDialogData {
  /** What is to be deleted: a class or a property. */
  kind: 'class' | 'property';
  iri: string;
  label: string;
  /** The data model, read again after each fix, so what is cleared is ticked. */
  graph: Signal<DataModelGraph | undefined>;
  /** Opens a class, a subclass or one whose link points here, where the dialog was opened from. */
  open: (classIri: string) => void;
  /** Browses a class's resources. */
  browse: (classIri: string) => void;
}

/**
 * Opens the dialog saying what keeps a class or a property from being deleted; `injector` gives it the page's data
 * model editor.
 */
export function openDeleteBlockersDialog(dialog: MatDialog, injector: Injector, data: DeleteBlockersDialogData): void {
  dialog.open(DeleteBlockersDialogComponent, { data, injector, width: '560px', maxWidth: '95vw', autoFocus: false });
}

/**
 * What keeps a class or a property from being deleted, each with the action that clears it: for a class, deleting a
 * link property no class has, taking a link off the class that has it, opening a subclass, browsing the resources;
 * for a property, taking it off each class that has it. Each is ticked once the data model, read again, no longer has
 * it; once all are, and the API agrees, it can be deleted from here.
 */
@Component({
  selector: 'app-delete-blockers-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIcon, TranslatePipe],
  template: `
    @let r = 'pages.dataModels2.deleteBlockers';
    <h2 mat-dialog-title data-cy="delete-blockers-title">{{ r + '.title' | translate: { name: data.label } }}</h2>
    <mat-dialog-content>
      @if (blockers.length) {
        <p class="intro">{{ (data.kind === 'class' ? r + '.intro' : r + '.introProperty') | translate }}</p>
      }
      <ul class="steps">
        @for (blocker of blockers; track blocker.id) {
          @let cleared = done().has(blocker.id);
          <li class="step" data-cy="class-delete-blocker" [class.done]="cleared">
            <span class="icon">
              <mat-icon>{{ cleared ? 'check' : iconOf(blocker) }}</mat-icon>
            </span>
            <span class="text">
              @switch (blocker.kind) {
                @case ('unusedLink') {
                  {{ r + '.unusedLink' | translate: { property: blocker.propertyLabel } }}
                  <small>{{ (cleared ? r + '.done' : r + '.unusedLinkHint') | translate }}</small>
                }
                @case ('link') {
                  {{ r + '.link' | translate: { property: blocker.propertyLabel, class: blocker.sourceLabel } }}
                  <small>{{
                    (cleared ? r + '.done' : r + '.linkHint') | translate: { class: blocker.sourceLabel }
                  }}</small>
                }
                @case ('subclass') {
                  {{ r + '.subclass' | translate: { class: blocker.subclassLabel } }}
                  <small>{{ (cleared ? r + '.done' : r + '.subclassHint') | translate }}</small>
                }
                @case ('resources') {
                  {{ r + '.resources' | translate: { count: blocker.count } }}
                  <small>{{ (cleared ? r + '.done' : r + '.resourcesHint') | translate }}</small>
                }
                @case ('usedBy') {
                  {{ r + '.usedBy' | translate: { class: blocker.classLabel } }}
                  <small>{{
                    (cleared ? r + '.done' : r + '.linkHint') | translate: { class: blocker.classLabel }
                  }}</small>
                }
              }
            </span>
            @if (!cleared) {
              @switch (blocker.kind) {
                @case ('unusedLink') {
                  <button
                    mat-stroked-button
                    type="button"
                    class="delete"
                    data-cy="class-delete-fix"
                    (click)="deleteProperty(blocker.property, blocker.propertyLabel)">
                    <mat-icon>delete</mat-icon>
                    {{ 'pages.dataModels2.deleteProperty' | translate }}
                  </button>
                }
                @case ('link') {
                  <button
                    mat-stroked-button
                    type="button"
                    data-cy="class-delete-fix"
                    (click)="removeLink(blocker.source, blocker.property, blocker.propertyLabel, blocker.sourceLabel)">
                    <mat-icon>remove_circle_outline</mat-icon>
                    {{ r + '.removeFrom' | translate: { class: blocker.sourceLabel } }}
                  </button>
                }
                @case ('subclass') {
                  <button
                    mat-stroked-button
                    type="button"
                    data-cy="class-delete-fix"
                    (click)="openClass(blocker.subclass)">
                    <mat-icon>open_in_new</mat-icon>
                    {{ r + '.open' | translate }}
                  </button>
                }
                @case ('usedBy') {
                  <button
                    mat-stroked-button
                    type="button"
                    data-cy="class-delete-fix"
                    (click)="removeLink(blocker.classIri, data.iri, data.label, blocker.classLabel)">
                    <mat-icon>remove_circle_outline</mat-icon>
                    {{ r + '.removeFrom' | translate: { class: blocker.classLabel } }}
                  </button>
                }
                @case ('resources') {
                  <button mat-stroked-button type="button" data-cy="class-delete-fix" (click)="browse()">
                    <mat-icon>view_list</mat-icon>
                    {{ r + '.browse' | translate }}
                  </button>
                }
              }
            }
          </li>
        }
      </ul>
      <!-- Once the data model shows nothing in the way: what the API says, when it still refuses. -->
      @if (cleared()) {
        @let check = apiCheck();
        @if (!check) {
          <p class="status">{{ 'pages.dataModels2.checkingDelete' | translate }}</p>
        } @else if (!check.canDo) {
          <p class="status blocked" data-cy="class-delete-api-reason">
            {{ r + '.apiReason' | translate }}
            @if (check.reason) {
              <small>{{ check.reason }}</small>
            }
          </p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>{{ 'ui.common.actions.close' | translate }}</button>
      <button
        mat-flat-button
        type="button"
        class="delete-class"
        data-cy="class-delete-confirm"
        [disabled]="!apiCheck()?.canDo"
        (click)="deleteClass()">
        <mat-icon>delete</mat-icon>
        {{ (data.kind === 'class' ? 'pages.dataModels2.deleteClass' : 'pages.dataModels2.deleteProperty') | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .intro {
        margin: 0 0 8px;
        color: $cool_gray_600;
      }

      .steps {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .step {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 10px 0;
        border-top: 1px solid $cool_gray_100;
        color: $cool_gray_900;
      }

      .icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #fff4dc;
        color: #6b4a00;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .done .icon {
        background: #e6f4ec;
        color: #1e7b4b;
      }

      .done .text {
        color: $cool_gray_500;
      }

      small {
        display: block;
        font-size: 12px;
        color: $cool_gray_500;
      }

      .step button {
        white-space: nowrap;
      }

      .delete:not([disabled]) {
        color: #b3261e;
      }

      .status {
        margin: 12px 0 0;
        color: $cool_gray_600;

        &.blocked {
          color: #6b4a00;
        }
      }

      .delete-class:not([disabled]) {
        background: #b3261e;
        color: white;
      }
    `,
  ],
})
export class DeleteBlockersDialogComponent {
  readonly data = inject<DeleteBlockersDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<DeleteBlockersDialogComponent>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _editing = injectDataModelEditing();

  /** What was in the way when the dialog opened; each stays listed, ticked once cleared. */
  private readonly _blockersOf = (graph: DataModelGraph | undefined): DeleteBlocker[] =>
    !graph
      ? []
      : this.data.kind === 'class'
        ? classDeleteBlockers(graph, this.data.iri)
        : propertyDeleteBlockers(graph, this.data.iri);
  readonly blockers: DeleteBlocker[] = this._blockersOf(this.data.graph());
  private readonly _current = computed(() => new Set(this._blockersOf(this.data.graph()).map(blocker => blocker.id)));
  readonly done = computed(() => new Set(this.blockers.map(b => b.id).filter(id => !this._current().has(id))));
  /** Whether the data model shows nothing in the way any more. */
  readonly cleared = computed(() => this._current().size === 0);
  /** What the API says of deleting the class, once nothing in the data model is in the way. */
  readonly apiCheck = signal<CanDo | undefined>(undefined);

  constructor() {
    // Asked each time the data model is read again with nothing in the way.
    effect(() => {
      this.data.graph();
      if (!this.cleared()) return;
      untracked(() => {
        this.apiCheck.set(undefined);
        (this.data.kind === 'class'
          ? this._editing.canDeleteClass(this.data.iri)
          : this._editing.canDeleteProperty(this.data.iri)
        )
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(check => this.apiCheck.set(check));
      });
    });
  }

  iconOf(blocker: DeleteBlocker): string {
    switch (blocker.kind) {
      case 'unusedLink':
      case 'link':
        return 'link';
      case 'subclass':
        return 'account_tree';
      case 'resources':
        return 'description';
      case 'usedBy':
        return 'category';
    }
  }

  deleteProperty(propertyIri: string, label: string): void {
    this._editing.deleteProperty(propertyIri, label).pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

  removeLink(classIri: string, propertyIri: string, propertyLabel: string, classLabel: string): void {
    this._editing
      .removeProperty(classIri, propertyIri, { property: propertyLabel, class: classLabel })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  openClass(classIri: string): void {
    this._dialogRef.close();
    this.data.open(classIri);
  }

  browse(): void {
    this._dialogRef.close();
    this.data.browse(this.data.iri);
  }

  /** Closes, then deletes the class or the property once confirmed. */
  deleteClass(): void {
    this._dialogRef.close();
    (this.data.kind === 'class'
      ? this._editing.deleteClass(this.data.iri, this.data.label)
      : this._editing.deleteProperty(this.data.iri, this.data.label)
    ).subscribe();
  }
}
