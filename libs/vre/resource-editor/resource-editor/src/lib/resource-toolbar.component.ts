import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DeleteResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/properties-display';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { EraseResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';

@Component({
  selector: 'app-resource-toolbar',
  template: `
    <span class="action">
      <button
        mat-icon-button
        matTooltip="Open resource in new tab"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        (click)="openResource()">
        <mat-icon>open_in_new</mat-icon>
      </button>
      <!-- Share resource: copy ark url, add to favorites or open in new tab -->
      <button
        color="primary"
        mat-icon-button
        class="share-res"
        data-cy="share-button"
        matTooltip="Share resource: {{ resource.versionArkUrl }}"
        matTooltipPosition="above"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>

      <app-permission-info [resource]="resource" />
      <!-- more menu with: delete, erase resource -->
      <button
        data-cy="resource-toolbar-more-button"
        color="primary"
        *ngIf="userCanDelete"
        mat-icon-button
        class="more-menu"
        matTooltip="More"
        matTooltipPosition="above"
        [matMenuTriggerFor]="more">
        <mat-icon>more_vert</mat-icon>
      </button>
    </span>

    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        matTooltip="Copy ARK url"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.versionArkUrl"
        (click)="notification.openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="notification.openSnackBar('Internal link copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy internal link to clipboard
      </button>
    </mat-menu>

    <mat-menu #more="matMenu" class="res-more-menu">
      <button
        data-cy="resource-toolbar-delete-resource-button"
        mat-menu-item
        matTooltip="Move resource to trash bin."
        matTooltipPosition="above"
        (click)="deleteResource()">
        <mat-icon>delete</mat-icon>
        {{ 'resourceEditor.resourceProperties.delete' | translate }}
      </button>
      <button
        data-cy="resource-toolbar-erase-resource-button"
        mat-menu-item
        matTooltip="Erase resource forever. This cannot be undone."
        matTooltipPosition="above"
        (click)="eraseResource()">
        <mat-icon>delete_forever</mat-icon>
        Erase resource
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .action {
        display: inline-flex;

        button {
          border-radius: 0;
        }
      }
    `,
  ],
})
export class ResourceToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;

  get userCanDelete() {
    return !this._resourceFetcherService.resourceVersion && ResourceUtil.userCanDelete(this.resource);
  }

  constructor(
    protected notification: NotificationService,
    private _resourceService: ResourceService,
    private _resourceFetcherService: ResourceFetcherService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
  ) {}

  openResource() {
    window.open(`/resource${this._resourceService.getResourcePath(this.resource.id)}`, '_blank');
  }

  deleteResource() {
    this._dialog.open<DeleteResourceDialogComponent, ReadResource>(DeleteResourceDialogComponent, {
      data: this.resource,
      viewContainerRef: this._viewContainerRef,
    });
  }

  eraseResource() {
    this._dialog.open<EraseResourceDialogComponent, ReadResource>(EraseResourceDialogComponent, {
      data: this.resource,
      viewContainerRef: this._viewContainerRef,
    });
  }
}
