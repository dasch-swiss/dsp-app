import { Component, EventEmitter, Inject, Input, Output, ViewContainerRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteResource, KnoraApiConnection, ReadResource, CanDoResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DeleteResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/properties-display';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import {
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { combineLatest, filter, map, Observable, BehaviorSubject, switchMap } from 'rxjs';

@Component({
  selector: 'app-resource-edit-more-menu',
  template: `
    <button
      data-cy="resource-toolbar-more-button"
      color="primary"
      mat-icon-button
      class="more-menu"
      matTooltip="More"
      matTooltipPosition="above"
      [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #more="matMenu" class="res-more-menu">
      @if (showEditLabel) {
        <button
          data-cy="resource-more-menu-edit-label-button"
          mat-menu-item
          matTooltip="Edit the label of this resource"
          matTooltipPosition="above"
          (click)="editResourceLabel()">
          <mat-icon>edit</mat-icon>
          Edit label
        </button>
      }

      @if (resourceCanBeDeleted$ | async; as resourceCanBeDeleted) {
        <button
          data-cy="resource-more-menu-delete-button"
          mat-menu-item
          [matTooltip]="
            resourceCanBeDeleted.canDo
              ? 'Move resource to trash bin.'
              : resourceCanBeDeleted.cannotDoReason || 'Checking if the resource can be deleted...'
          "
          matTooltipPosition="above"
          [disabled]="!resourceCanBeDeleted.canDo"
          (click)="deleteResource()">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 32px; height: 24px;">
              <mat-icon>delete</mat-icon>
            </span>
            Delete
          </div>
        </button>

        @if (userCanDelete()) {
          <button
            data-cy="resource-more-menu-erase-button"
            mat-menu-item
            [matTooltip]="
              resourceCanBeDeleted.canDo
                ? 'Erase resource forever. This cannot be undone.'
                : resourceCanBeDeleted.cannotDoReason || 'Checking if resource can be deleted...'
            "
            matTooltipPosition="above"
            [disabled]="!resourceCanBeDeleted.canDo"
            (click)="eraseResource()">
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 32px; height: 24px;">
                <mat-icon>delete_forever</mat-icon>
              </span>
              Erase resource
            </span>
          </button>
        }
      } @else {
        <button
          data-cy="resource-more-menu-delete-button"
          mat-menu-item
          matTooltip="Checking if the resource can be deleted..."
          matTooltipPosition="above"
          disabled>
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 32px; height: 24px;">
              <app-progress-spinner />
            </span>
            Delete
          </div>
        </button>

        @if (userCanDelete()) {
          <button
            data-cy="resource-more-menu-erase-button"
            mat-menu-item
            matTooltip="Checking if resource can be deleted..."
            matTooltipPosition="above"
            disabled>
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 32px; height: 24px;">
                <app-progress-spinner />
              </span>
              Erase resource
            </span>
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [
    `
      .more-menu {
        border-radius: 0;
      }
    `,
  ],
  standalone: false,
})
export class ResourceEditMoreMenuComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;
  @Input() showEditLabel = false;

  @Output() resourceDeleted = new EventEmitter<void>();
  @Output() resourceErased = new EventEmitter<void>();
  @Output() resourceUpdated = new EventEmitter<void>();

  userCanDelete() {
    return ResourceUtil.userCanDelete(this.resource);
  }

  resourceCanBeDeleted$!: Observable<CanDoResponse>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    public resourceFetcher: ResourceFetcherService,
    private _viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit() {
    this.resourceCanBeDeleted$ = combineLatest([
      this.resourceFetcher.userCanDelete$,
      this._canDeleteResource$(this.resource),
    ]).pipe(
      map(([userCanDelete, resourceCanBeDeleted]) => {
        if (!userCanDelete) {
          return {
            canDo: false,
            cannotDoReason: 'You do not have permission to delete this resource.',
          } as CanDoResponse;
        }

        if (resourceCanBeDeleted instanceof CanDoResponse) {
          return resourceCanBeDeleted.canDo
            ? {
                canDo: resourceCanBeDeleted?.canDo,
              }
            : resourceCanBeDeleted;
        }

        return {
          canDo: true,
        };
      })
    );
  }

  private _canDeleteResource$(resource: ReadResource): Observable<CanDoResponse> {
    const resourceToCheck = new DeleteResource();
    resourceToCheck.id = resource.id;
    resourceToCheck.type = resource.type;
    resourceToCheck.lastModificationDate = resource.lastModificationDate;
    return this._dspApiConnection.v2.res
      .canDeleteResource(resourceToCheck)
      .pipe(filter(res => res instanceof CanDoResponse));
  }

  deleteResource() {
    this._dialog
      .open<DeleteResourceDialogComponent, ReadResource, boolean>(DeleteResourceDialogComponent, {
        data: this.resource,
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.resourceDeleted.emit();
        }
      });
  }

  eraseResource() {
    this._dialog
      .open<EraseResourceDialogComponent, ReadResource, boolean>(EraseResourceDialogComponent, {
        data: this.resource,
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.resourceErased.emit();
        }
      });
  }

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
