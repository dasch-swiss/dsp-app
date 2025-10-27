import { Component, EventEmitter, Inject, inject, Input, Output, ViewContainerRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteResource, KnoraApiConnection, ReadResource, CanDoResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DeleteResourceDialogComponent } from '@dasch-swiss/vre/resource-editor/properties-display';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import {
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
} from '@dasch-swiss/vre/resource-editor/resource-properties';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, filter, map, Observable } from 'rxjs';

@Component({
  selector: 'app-resource-edit-more-menu',
  template: `
    <button
      data-cy="resource-toolbar-more-button"
      color="primary"
      mat-icon-button
      class="more-menu"
      [matTooltip]="'resourceEditor.moreMenu.more' | translate"
      matTooltipPosition="above"
      [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #more="matMenu" class="res-more-menu">
      @if (showEditLabel) {
        <button
          data-cy="resource-more-menu-edit-label-button"
          mat-menu-item
          [matTooltip]="'resourceEditor.moreMenu.editLabelTooltip' | translate"
          matTooltipPosition="above"
          (click)="editResourceLabel()">
          <mat-icon>edit</mat-icon>
          {{ 'resourceEditor.moreMenu.editLabel' | translate }}
        </button>
      }

      @if (resourceCanBeDeleted$ | async; as resourceCanBeDeleted) {
        <button
          data-cy="resource-more-menu-delete-button"
          mat-menu-item
          [matTooltip]="
            resourceCanBeDeleted.canDo
              ? ('resourceEditor.moreMenu.moveToTrash' | translate)
              : resourceCanBeDeleted.cannotDoReason || ('resourceEditor.moreMenu.checkingPermission' | translate)
          "
          matTooltipPosition="above"
          [disabled]="!resourceCanBeDeleted.canDo"
          (click)="deleteResource()">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 32px; height: 24px;">
              <mat-icon>delete</mat-icon>
            </span>
            {{ 'ui.common.actions.delete' | translate }}
          </div>
        </button>

        @if (userCanDelete()) {
          <button
            data-cy="resource-more-menu-erase-button"
            mat-menu-item
            [matTooltip]="
              resourceCanBeDeleted.canDo
                ? ('resourceEditor.moreMenu.eraseResourceTooltip' | translate)
                : resourceCanBeDeleted.cannotDoReason || ('resourceEditor.moreMenu.checkingPermissionErase' | translate)
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
        }
      } @else {
        <button
          data-cy="resource-more-menu-delete-button"
          mat-menu-item
          [matTooltip]="'resourceEditor.moreMenu.checkingPermission' | translate"
          matTooltipPosition="above"
          disabled>
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 32px; height: 24px;">
              <app-progress-spinner />
            </span>
            {{ 'ui.common.actions.delete' | translate }}
          </div>
        </button>

        @if (userCanDelete()) {
          <button
            data-cy="resource-more-menu-erase-button"
            mat-menu-item
            [matTooltip]="'resourceEditor.moreMenu.checkingPermissionErase' | translate"
            matTooltipPosition="above"
            disabled>
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 32px; height: 24px;">
                <app-progress-spinner />
              </span>
              {{ 'resourceEditor.moreMenu.eraseResource' | translate }}
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

  private readonly _translateService = inject(TranslateService);

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
            cannotDoReason: this._translateService.instant('resourceEditor.moreMenu.noPermission'),
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
