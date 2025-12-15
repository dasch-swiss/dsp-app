import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
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
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
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
