import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdminProjectsApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import {
  DeleteResourceDialogComponent,
  DeleteResourceDialogProps,
  EditResourceLabelDialogComponent,
  EditResourceLabelDialogProps,
  EraseResourceDialogComponent,
  EraseResourceDialogProps,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { DspResource, ResourceService, ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-resource-toolbar',
  template: `
    <!-- tools: share, add to favorites, edit, delete etc. -->
    <span class="action" [class.deleted]="resource.res.isDeleted">
      <!-- Toggle show all comments button-->
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

      <!-- permission info: display full info in case of system or project admin; otherwise display only user's permissions -->
      <app-permission-info
        *ngIf="adminPermissions"
        [hasPermissions]="resource.res.hasPermissions"
        [userHasPermission]="resource.res.userHasPermission"></app-permission-info>
      <app-permission-info
        *ngIf="!adminPermissions"
        [userHasPermission]="resource.res.userHasPermission"></app-permission-info>
      <!-- more menu with: delete, erase resource -->
      <button
        data-cy="resource-toolbar-more-button"
        color="primary"
        *ngIf="(userCanEdit && showEditLabel) || userCanDelete || adminPermissions"
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
        (click)="openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.res.id"
        (click)="openSnackBar('Internal link copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy internal link to clipboard
      </button>
    </mat-menu>

    <mat-menu #more="matMenu" class="res-more-menu">
      <button
        *ngIf="showEditLabel"
        [disabled]="!adminPermissions && !userCanEdit"
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
        [disabled]="!adminPermissions && userCanDelete === false"
        mat-menu-item
        matTooltip="Move resource to trash bin."
        matTooltipPosition="above"
        (click)="deleteResource()">
        <mat-icon>delete</mat-icon>
        Delete resource
      </button>
      <button
        *ngIf="adminPermissions"
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

        .toggle-props {
          padding: 12px;
          height: 48px;
        }

        button {
          border-radius: 0;
        }
      }
    `,
  ],
})
export class ResourceToolbarComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;
  @Input() adminPermissions = false;
  @Input() showEditLabel = true;

  @Input() lastModificationDate!: string;
  @Input() linkToNewTab?: string;

  @Output() afterResourceDeleted = new EventEmitter();

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.resource.res);
  }

  get userCanDelete() {
    return ResourceUtil.userCanDelete(this.resource.res);
  }

  constructor(
    private _notification: NotificationService,
    private _resourceService: ResourceService,
    private _cd: ChangeDetectorRef,
    private _dialog: MatDialog,
    private _adminProjectsApi: AdminProjectsApiService,
    private _viewContainerRef: ViewContainerRef,
    private _resourceFetcher: ResourceFetcherService
  ) {}

  ngOnInit(): void {
    if (this.resource.res.attachedToProject) {
      this._adminProjectsApi.getAdminProjectsIriProjectiri(this.resource.res.attachedToProject).subscribe(res => {
        this._cd.detectChanges();
      });
    }
    this._cd.detectChanges();
  }

  openResource() {
    window.open(`/resource${this._getResourceSharedPath()}`, '_blank');
  }

  private _getResourceSharedPath() {
    if (this.linkToNewTab) {
      return this.linkToNewTab;
    }

    return this._resourceService.getResourcePath(this.resource.res.id);
  }

  editResourceLabel() {
    this._dialog
      .open<EditResourceLabelDialogComponent, EditResourceLabelDialogProps, boolean>(EditResourceLabelDialogComponent, {
        data: { resource: this.resource.res },
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .pipe(filter(answer => !!answer))
      .subscribe(answer => {
        this._resourceFetcher.reload();
        this._cd.markForCheck();
      });
  }

  deleteResource() {
    this._dialog
      .open<DeleteResourceDialogComponent, DeleteResourceDialogProps>(DeleteResourceDialogComponent, {
        data: {
          resource: this.resource,
          lastModificationDate: this.lastModificationDate,
        },
      })
      .afterClosed()
      .pipe(filter(response => !!response))
      .subscribe(() => {
        this.afterResourceDeleted.emit();
      });
  }

  eraseResource() {
    this._dialog
      .open<EraseResourceDialogComponent, EraseResourceDialogProps>(EraseResourceDialogComponent, {
        data: {
          resource: this.resource,
          lastModificationDate: this.lastModificationDate,
        },
      })
      .afterClosed()
      .pipe(filter(response => !!response))
      .subscribe(() => {
        this.afterResourceDeleted.emit();
      });
  }

  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }
}
