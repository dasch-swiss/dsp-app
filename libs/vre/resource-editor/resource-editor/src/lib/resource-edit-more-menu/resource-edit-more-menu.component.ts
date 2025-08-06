import { Component, EventEmitter, Inject, Input, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { DeleteResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/properties-display';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import {
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { Store } from '@ngxs/store';
import { combineLatest, map, of, take } from 'rxjs';
import { CanDeleteResource } from './can-delete-resource.interface';

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
      [matMenuTriggerFor]="more"
      (menuOpened)="checkResourceCanBeDeleted()">
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #more="matMenu" class="res-more-menu">
      <button
        *ngIf="showEditLabel"
        data-cy="resource-more-menu-edit-label-button"
        mat-menu-item
        matTooltip="Edit the label of this resource"
        matTooltipPosition="above"
        (click)="editResourceLabel()">
        <mat-icon>edit</mat-icon>
        Edit label
      </button>

      <button
        data-cy="resource-more-menu-delete-button"
        mat-menu-item
        [matTooltip]="
          resourceCanBeDeleted?.canDo
            ? 'Move resource to trash bin.'
            : resourceCanBeDeleted?.reason || 'Checking if the resource can be deleted...'
        "
        matTooltipPosition="above"
        [disabled]="!resourceCanBeDeleted?.canDo"
        (click)="deleteResource()">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 32px; height: 24px;">
            <ng-container *ngIf="resourceCanBeDeleted === undefined; else deleteIcon">
              <app-progress-spinner />
            </ng-container>
            <ng-template #deleteIcon>
              <mat-icon>delete</mat-icon>
            </ng-template>
          </span>
          Delete
        </div>
      </button>

      <button
        *ngIf="isAdmin$ | async"
        data-cy="resource-more-menu-erase-button"
        mat-menu-item
        [matTooltip]="
          resourceCanBeDeleted?.canDo
            ? 'Erase resource forever. This cannot be undone.'
            : resourceCanBeDeleted?.reason || 'Checking if resource can be deleted...'
        "
        matTooltipPosition="above"
        [disabled]="!resourceCanBeDeleted?.canDo"
        (click)="eraseResource()">
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 32px; height: 24px;">
            <ng-container *ngIf="resourceCanBeDeleted === undefined; else eraseIcon">
              <app-progress-spinner />
            </ng-container>
            <ng-template #eraseIcon>
              <mat-icon>delete_forever</mat-icon>
            </ng-template>
          </span>
          Erase resource
        </span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .more-menu {
        border-radius: 0;
      }
    `,
  ],
})
export class ResourceEditMoreMenuComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Input() showEditLabel = false;

  @Output() resourceDeleted = new EventEmitter<void>();
  @Output() resourceErased = new EventEmitter<void>();
  @Output() resourceUpdated = new EventEmitter<void>();

  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);
  resourceCanBeDeleted?: CanDeleteResource;

  constructor(
    public resourceFetcher: ResourceFetcherService,
    private _store: Store,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
  ) {}

  checkResourceCanBeDeleted() {
    combineLatest([this.resourceFetcher.userCanDelete$, this._resourceCanBeDeletedTechnically(this.resource)])
      .pipe(
        take(1),
        map(([userCanDelete, technicalCheck]) => {
          if (!userCanDelete) {
            return {
              canDo: false,
              reason: 'You do not have permission to delete this resource.',
            };
          }

          if (!technicalCheck.canDo) {
            return technicalCheck;
          }

          return {
            canDo: true,
            reason: 'Resource can be deleted.',
          };
        })
      )
      .subscribe((canDelete: CanDeleteResource) => {
        this.resourceCanBeDeleted = canDelete;
      });
  }

  private _resourceCanBeDeletedTechnically(resource: ReadResource) {
    if (resource.incomingReferences.length > 0) {
      return of({
        canDo: false,
        reason: 'This resource cannot be deleted as it has incoming references.',
      });
    }

    const noIncomingLinks$ = this._dspApiConnection.v2.search
      .doSearchIncomingLinks(resource.id)
      .pipe(map(res => res.resources.length === 0));

    const noStillImageLinks$ = this._dspApiConnection.v2.search
      .doSearchStillImageRepresentationsCount(resource.id)
      .pipe(map(res => res.numberOfResults === 0));

    const noRegions$ = resource.properties[Constants.HasStillImageFileValue]
      ? this._dspApiConnection.v2.search
          .doSearchIncomingRegions(resource.id)
          .pipe(map(seq => seq.resources.length === 0))
      : of(true);

    return combineLatest([noIncomingLinks$, noStillImageLinks$, noRegions$]).pipe(
      map(([noLinks, noStills, noRegions]) => {
        const canDelete = noLinks && noStills && noRegions;
        if (canDelete) {
          return { canDo: true };
        }

        const reasons: string[] = [];
        if (!noLinks) reasons.push('incoming links');
        if (!noStills) reasons.push('still image representations (pages) linked to it');
        if (!noRegions) reasons.push('regions annotating the still image representation');

        return {
          canDo: false,
          reason: `This resource cannot be deleted as it has ${reasons.join(' and ')}.`,
        };
      })
    );
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
