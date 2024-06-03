import { ChangeDetectorRef, Component, Input, OnInit, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteResourceResponse, PermissionUtil, ReadProject } from '@dasch-swiss/dsp-js';
import { AdminProjectsApiService } from '@dasch-swiss/vre/open-api';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import {
  Events as CommsEvents,
  ComponentCommunicationEventService,
  EmitEvent,
  OntologyService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';
import {
  DeleteResourceDialogComponent,
  DeleteResourceDialogProps,
  EditResourceLabelDialogComponent,
  EditResourceLabelDialogProps,
  EraseResourceDialogComponent,
  EraseResourceDialogProps,
} from '@dasch-swiss/vre/shared/app-resource-properties';
import { LoadClassItemsCountAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
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
        color="primary"
        *ngIf="attachedProject?.status && ((userCanEdit && showEditLabel) || userCanDelete || adminPermissions)"
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
        [cdkCopyToClipboard]="resource.res.versionArkUrl"
        (click)="openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
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
        mat-menu-item
        matTooltip="Edit the label of this resource"
        matTooltipPosition="above"
        (click)="editResourceLabel()">
        <mat-icon>edit</mat-icon>
        Edit label
      </button>
      <button
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
  /**
   * in case properties belongs to an annotation (e.g. region in still images)
   * in this case we don't have to display the isRegionOf property
   */
  @Input() isAnnotation = false;

  @Input() showToggleProperties = false;
  @Input() showEditLabel = true;

  @Input() attachedProject!: ReadProject;

  @Input() lastModificationDate!: string;
  @Input() linkToNewTab?: string;

  userCanDelete!: boolean;
  userCanEdit!: boolean;
  canReadComments!: boolean;

  constructor(
    private _notification: NotificationService,
    private _resourceService: ResourceService,
    private _cd: ChangeDetectorRef,
    private _componentCommsService: ComponentCommunicationEventService,
    private _ontologyService: OntologyService,
    private _dialog: MatDialog,
    private _adminProjectsApi: AdminProjectsApiService,
    private _store: Store,
    private _viewContainerRef: ViewContainerRef,
    private _regionService: RegionService
  ) {}

  ngOnInit(): void {
    if (this.resource.res) {
      // get user permissions
      const allPermissions = PermissionUtil.allUserPermissions(
        this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
      );

      this.canReadComments = true; // allPermissions.indexOf(PermissionUtil.Permissions.RV) === -1; // TODO permissions to show comments should be provided
      // if user has modify permissions, set addButtonIsVisible to true so the user see's the add button
      this.userCanEdit = allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
      this.userCanDelete = allPermissions.indexOf(PermissionUtil.Permissions.D) !== -1;
    }
    if (!this.attachedProject && this.resource.res.attachedToProject) {
      this._adminProjectsApi.getAdminProjectsIriProjectiri(this.resource.res.attachedToProject).subscribe(res => {
        this.attachedProject = res.project as ReadProject;
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
        this._componentCommsService.emit(new EmitEvent(CommsEvents.resourceChanged));
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
      .subscribe(response => {
        this._onResourceDeleted(response);
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
      .subscribe(response => {
        this._onResourceDeleted(response);
      });
  }

  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  private _onResourceDeleted(response: DeleteResourceResponse) {
    this._notification.openSnackBar(`${response.result}: ${this.resource.res.label}`);
    if (this.resource.isRegion) {
      this._regionService.updateRegions();
      this._cd.markForCheck();
      return;
    }

    const ontologyIri = this._ontologyService.getOntologyIriFromRoute(this.attachedProject.shortcode);
    const classId = this.resource.res.entityInfo.classes[this.resource.res.type]?.id;
    this._store.dispatch(new LoadClassItemsCountAction(ontologyIri, classId));
    this._componentCommsService.emit(new EmitEvent(CommsEvents.resourceDeleted));
  }
}
