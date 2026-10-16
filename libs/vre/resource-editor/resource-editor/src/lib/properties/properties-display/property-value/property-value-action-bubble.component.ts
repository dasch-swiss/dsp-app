import { CDK_DRAG_PARENT, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, map, Observable, of } from 'rxjs';
import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';
import { ResourceUtil } from '../../../representation/resource.util';
import { PropertyValueService } from './property-value.service';
import { VALUE_ACTIONS_OPTIONS, ValueActionsOptions } from './value-actions-options.token';

/**
 * A value's actions, at the end of the value's own line.
 *
 * In the line rather than floating over it: a bubble over the value covered the text the user was
 * about to act on (DEV-7494). Who created the value, and when, rides in the Edit button's tooltip
 * rather than a button of its own — it only gets one where there is no Edit button to carry it.
 */
@Component({
  selector: 'app-property-value-action-bubble',
  imports: [AsyncPipe, MatIconButton, MatIcon, MatTooltip, TranslatePipe, CdkDragHandle],
  template: `
    <div class="value-actions" data-cy="action-bubble">
      @if (userHasPermission('edit')) {
        <button
          mat-icon-button
          type="button"
          class="value-action edit-button"
          data-cy="edit-button"
          [matTooltip]="(editTooltip$ | async) ?? ''"
          [attr.aria-label]="'resourceEditor.resourceProperties.actions.edit' | translate"
          (click)="$event.stopPropagation(); editAction.emit()">
          <mat-icon>edit</mat-icon>
        </button>
      } @else if (date && showInfo()) {
        @if (infoTooltip$ | async; as infoTooltip) {
          <button
            mat-icon-button
            type="button"
            class="value-action info-button"
            data-cy="info-button"
            [matTooltip]="infoTooltip"
            [attr.aria-label]="infoTooltip"
            (click)="$event.stopPropagation()">
            <mat-icon>info_outline</mat-icon>
          </button>
        }
      }

      @if (canDrag) {
        <span
          cdkDragHandle
          class="value-action drag-handle"
          data-cy="drag-handle"
          role="img"
          [attr.aria-label]="'resourceEditor.resourceProperties.actions.dragToReorder' | translate"
          [matTooltip]="'resourceEditor.resourceProperties.actions.dragToReorder' | translate">
          <mat-icon>drag_indicator</mat-icon>
        </span>
      }

      @if (userHasPermission('delete')) {
        <span
          [matTooltip]="
            disableDeleteButton
              ? ('resourceEditor.resourceProperties.actions.cannotDeleteRequired' | translate)
              : ('resourceEditor.resourceProperties.actions.delete' | translate)
          ">
          <button
            mat-icon-button
            type="button"
            class="value-action delete"
            [disabled]="disableDeleteButton"
            data-cy="delete-button"
            [attr.aria-label]="'resourceEditor.resourceProperties.actions.delete' | translate"
            (click)="$event.stopPropagation(); deleteAction.emit()">
            <mat-icon>delete_outline</mat-icon>
          </button>
        </span>
      }
    </div>
  `,
  styleUrls: ['./property-value-actions.scss', './property-value-action-bubble.component.scss'],
  host: { '[class.is-empty]': 'isEmpty' },
})
export class PropertyValueActionBubbleComponent implements OnInit {
  @Input({ required: true }) date!: string;
  @Output() editAction = new EventEmitter();
  @Output() deleteAction = new EventEmitter();

  private readonly _options = inject(VALUE_ACTIONS_OPTIONS);
  /** See {@link ValueActionsOptions.showInfo$}. */
  protected readonly showInfo = toSignal(this._options.showInfo$, { initialValue: true });

  infoTooltip$!: Observable<string>;
  /** "Edit", followed by who created the value and when, once that is known. */
  editTooltip$!: Observable<string>;

  constructor(
    private readonly _resourceFetcherService: ResourceFetcherService,
    private readonly _propertyValueService: PropertyValueService,
    private readonly _translateService: TranslateService
  ) {}

  get disableDeleteButton(): boolean {
    const isRequired = [Cardinality._1, Cardinality._1_n].includes(this._propertyValueService.cardinality);
    const isOnlyValue = this._propertyValueService.editModeData.values.length === 1;
    return isRequired && isOnlyValue;
  }

  /** The row this value sits in, when it sits in a reorderable list. */
  private readonly _drag = inject<CdkDrag>(CDK_DRAG_PARENT, { optional: true });

  /** Whether the value can be moved now: never while another is edited or a reorder is saving. */
  get canDrag(): boolean {
    return !!this._drag && !this._drag.disabled;
  }

  /** Nothing to offer: the value's line is then not marked on hover either. */
  get isEmpty(): boolean {
    return (
      !this.userHasPermission('edit') &&
      !this.userHasPermission('delete') &&
      !this.canDrag &&
      !(this.date && this.showInfo())
    );
  }

  ngOnInit() {
    this.infoTooltip$ = this._getInfoToolTip();
    const edit = this._translateService.instant('resourceEditor.resourceProperties.actions.edit');
    this.editTooltip$ =
      this.date && this._options.creationInfoInEditTooltip
        ? this.infoTooltip$.pipe(map(info => `${edit} · ${info}`))
        : of(edit);
  }

  userHasPermission(permissionType: 'edit' | 'delete'): boolean {
    if (this._resourceFetcherService.resourceVersion) {
      return false;
    }

    const value = this._propertyValueService.editModeData.values[0];
    return permissionType === 'edit' ? ResourceUtil.userCanEdit(value) : ResourceUtil.userCanDelete(value);
  }

  private _getInfoToolTip() {
    return (this._resourceFetcherService.resource$ ?? EMPTY).pipe(
      map(resource => {
        const creator = resource!.res!.attachedToUser;
        return this._translateService.instant('resourceEditor.resourceProperties.actions.creationInfo', {
          date: this.date,
          creator,
        });
      })
    );
  }
}
