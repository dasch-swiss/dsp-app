import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDoResponse, ReadResource } from '@dasch-swiss/dsp-js';
import { DeleteResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/properties-display';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-delete-button',
  template: `
    @if (resourceCanBeDeleted$ | async; as resourceCanBeDeleted) {
      <button
        data-cy="resource-more-menu-delete-button"
        mat-menu-item
        [matTooltip]="
          resourceCanBeDeleted.canDo
            ? ('resourceEditor.moreMenu.moveToTrash' | translate)
            : resourceCanBeDeleted.cannotDoReason || ('resourceEditor.moreMenu.checkingPermission' | translate)
        "
        matTooltipPosition="above"
        [disabled]="!resourceCanBeDeleted.canDo"
        (click)="deleteResource()">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 32px; height: 24px;">
            <mat-icon>delete</mat-icon>
          </span>
          {{ 'ui.common.actions.delete' | translate }}
        </div>
      </button>
    } @else {
      <app-loading-menu-item
        dataCy="resource-more-menu-delete-button"
        tooltipKey="resourceEditor.moreMenu.checkingPermission"
        labelKey="ui.common.actions.delete" />
    }
  `,
  standalone: false,
})
export class DeleteButtonComponent {
  @Input({ required: true }) resourceCanBeDeleted$!: Observable<CanDoResponse>;
  @Input({ required: true }) resource!: ReadResource;
  @Output() deleted = new EventEmitter<void>();

  constructor(
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
  ) {}

  deleteResource() {
    this._dialog
      .open<DeleteResourceDialogComponent, ReadResource, boolean>(DeleteResourceDialogComponent, {
        data: this.resource,
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.deleted.emit();
        }
      });
  }
}
