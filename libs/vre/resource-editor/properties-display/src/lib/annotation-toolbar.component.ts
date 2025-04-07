import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { RegionService, ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import {
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { DeleteResourceDialogComponent } from './delete-resource-dialog.component';

@Component({
  selector: 'app-annotation-toolbar',
  template: `
    <span class="action">
      <button
        mat-icon-button
        matTooltip="Open resource in new tab"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        (click)="openRegionInNewTab()">
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
      <button
        data-cy="resource-toolbar-more-button"
        color="primary"
        *ngIf="userCanEdit || userCanDelete"
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
        (click)="this.notification.openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="this.notification.openSnackBar('Internal link copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy internal link to clipboard
      </button>
    </mat-menu>

    <mat-menu #more="matMenu" class="res-more-menu">
      <button
        [disabled]="!userCanEdit"
        data-cy="resource-toolbar-edit-resource-button"
        mat-menu-item
        matTooltip="Edit the label of this resource"
        matTooltipPosition="above"
        (click)="editResourceLabel()">
        <mat-icon>edit</mat-icon>
        Edit label
      </button>
      <button
        data-cy="resource-toolbar-delete-resource-button"
        [disabled]="!userCanDelete"
        mat-menu-item
        matTooltip="Move resource to trash bin."
        matTooltipPosition="above"
        (click)="deleteResource()">
        <mat-icon>delete</mat-icon>
        {{ 'form.resource.title.delete' | translate }}
      </button>
      <button
        *ngIf="isAdmin$ | async"
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
export class AnnotationToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Input({ required: true }) parentResourceId!: string;

  isAdmin$: Observable<boolean | undefined> = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.resource);
  }

  get userCanDelete() {
    return ResourceUtil.userCanDelete(this.resource);
  }

  constructor(
    protected notification: NotificationService,
    private _regionService: RegionService,
    private _dialog: MatDialog,
    private _resourceService: ResourceService,
    private _resourceFetcher: ResourceFetcherService,
    private _store: Store,
    private _viewContainerRef: ViewContainerRef
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
          this._resourceFetcher.reload();
        }
      });
  }

  deleteResource() {
    this._dialog
      .open<DeleteResourceDialogComponent, ReadResource, boolean>(DeleteResourceDialogComponent, {
        data: this.resource,
      })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this._afterResourceDeleted();
        }
      });
  }

  eraseResource() {
    this._dialog
      .open<EraseResourceDialogComponent, ReadResource, boolean>(EraseResourceDialogComponent, { data: this.resource })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this._afterResourceDeleted();
        }
      });
  }

  private _afterResourceDeleted() {
    this._regionService.updateRegions$().pipe(take(1)).subscribe();
  }

  openRegionInNewTab() {
    const annotationId = encodeURIComponent(this.resource.id);
    const resPath = this._resourceService.getResourcePath(this.parentResourceId);
    window.open(
      `/${RouteConstants.resource}${resPath}?${RouteConstants.annotationQueryParam}=${annotationId}`,
      '_blank'
    );
  }
}
