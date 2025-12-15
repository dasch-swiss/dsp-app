import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanDoResponse, ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { EraseResourceDialogComponent } from '../resource-properties/erase-resource-dialog.component';
import { LoadingMenuItemComponent } from './loading-menu-item.component';

@Component({
  selector: 'app-erase-button',
  template: `
    @if (resourceCanBeDeleted$ | async; as resourceCanBeDeleted) {
      <button
        data-cy="resource-more-menu-erase-button"
        mat-menu-item
        [matTooltip]="
          resourceCanBeDeleted.canDo
            ? ('resourceEditor.moreMenu.eraseResourceTooltip' | translate)
            : ('resourceEditor.moreMenu.cannotEraseIncomingLinks' | translate)
        "
        matTooltipPosition="above"
        [disabled]="!resourceCanBeDeleted.canDo"
        (click)="eraseResource()">
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 32px; height: 24px;">
            <mat-icon>delete_forever</mat-icon>
          </span>
          {{ 'resourceEditor.moreMenu.eraseResource' | translate }}
        </span>
      </button>
    } @else {
      <app-loading-menu-item
        dataCy="resource-more-menu-erase-button"
        tooltipKey="resourceEditor.moreMenu.checkingPermissionErase"
        labelKey="resourceEditor.moreMenu.eraseResource" />
    }
  `,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe,
    LoadingMenuItemComponent,
  ],
})
export class EraseButtonComponent {
  @Input({ required: true }) resourceCanBeDeleted$!: Observable<CanDoResponse>;
  @Input({ required: true }) resource!: ReadResource;
  @Output() erased = new EventEmitter<void>();

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef
  ) {}

  eraseResource() {
    this._dialog
      .open<EraseResourceDialogComponent, ReadResource, boolean>(EraseResourceDialogComponent, {
        data: this.resource,
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.erased.emit();
        }
      });
  }
}
