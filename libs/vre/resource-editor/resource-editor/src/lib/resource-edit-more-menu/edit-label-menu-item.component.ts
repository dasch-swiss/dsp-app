import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { EditResourceLabelDialogComponent } from '../resource-properties/edit-resource-label-dialog.component';

@Component({
  selector: 'app-edit-label-menu-item',
  template: `
    <button
      data-cy="resource-more-menu-edit-label-button"
      mat-menu-item
      [matTooltip]="'resourceEditor.moreMenu.editLabelTooltip' | translate"
      matTooltipPosition="above"
      (click)="editResourceLabel()">
      <mat-icon>edit</mat-icon>
      {{ 'resourceEditor.moreMenu.editLabel' | translate }}
    </button>
  `,
  standalone: false,
})
export class EditLabelMenuItemComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Output() resourceUpdated = new EventEmitter<void>();

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef
  ) {}

  editResourceLabel() {
    this._dialog
      .open<EditResourceLabelDialogComponent, ReadResource, boolean>(EditResourceLabelDialogComponent, {
        data: this.resource,
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(answer => {
        if (answer) {
          this.resourceUpdated.emit();
        }
      });
  }
}
