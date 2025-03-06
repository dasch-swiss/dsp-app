import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import {
  DeleteResourceDialogComponent,
  EraseResourceDialogComponent,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-resource-toolbar',
  template: `
    <span class="action" [class.deleted]="resource.res.isDeleted">
      <button
        mat-icon-button
        matTooltip="Open resource in new tab"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        [disabled]="resource.res.isDeleted"
        (click)="openResource()">
        <mat-icon>open_in_new</mat-icon>
      </button>
      <!-- Share resource: copy ark url, add to favorites or open in new tab -->
      <button
        color="primary"
        mat-icon-button
        class="share-res"
        data-cy="share-button"
        matTooltip="Share resource: {{ resource.res.versionArkUrl }}"
        matTooltipPosition="above"
        [disabled]="resource.res.isDeleted"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>

      <app-permission-info [resource]="resource.res" />
      <!-- more menu with: delete, erase resource -->
      <button
        data-cy="resource-toolbar-more-button"
        color="primary"
        *ngIf="userCanDelete || (isAdmin$ | async)"
        mat-icon-button
        class="more-menu"
        matTooltip="More"
        matTooltipPosition="above"
        [matMenuTriggerFor]="more"
        [disabled]="resource.res.isDeleted">
        <mat-icon>more_vert</mat-icon>
      </button>
    </span>

    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        matTooltip="Copy ARK url"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.res.versionArkUrl"
        (click)="notification.openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.res.id"
        (click)="notification.openSnackBar('Internal link copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy internal link to clipboard
      </button>
    </mat-menu>

    <mat-menu #more="matMenu" class="res-more-menu">
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
export class ResourceToolbarComponent {
  @Input({ required: true }) resource!: DspResource;

  isAdmin$: Observable<boolean | undefined> = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  get userCanDelete() {
    return ResourceUtil.userCanDelete(this.resource.res);
  }

  constructor(
    protected notification: NotificationService,
    private _resourceService: ResourceService,
    private _resourceFetcherService: ResourceFetcherService,
    private _dialog: MatDialog,
    private _store: Store
  ) {}

  openResource() {
    window.open(`/resource${this._resourceService.getResourcePath(this.resource.res.id)}`, '_blank');
  }

  deleteResource() {
    this._dialog
      .open<DeleteResourceDialogComponent, ReadResource>(DeleteResourceDialogComponent, { data: this.resource.res })
      .afterClosed()
      .pipe(filter(response => !!response))
      .subscribe(() => {
        this._resourceFetcherService.resourceIsDeleted();
      });
  }

  eraseResource() {
    this._dialog
      .open<EraseResourceDialogComponent, ReadResource>(EraseResourceDialogComponent, { data: this.resource.res })
      .afterClosed()
      .pipe(filter(response => !!response))
      .subscribe(() => {
        this._resourceFetcherService.resourceIsDeleted();
      });
  }
}
