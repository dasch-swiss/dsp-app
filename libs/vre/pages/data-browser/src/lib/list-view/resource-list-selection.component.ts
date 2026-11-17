import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import {
  BulkEditDialogComponent,
  BulkEditDialogProps,
  BulkEditDialogResult,
} from '../bulk-edit/bulk-edit-dialog.component';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ResourceLinkDialogComponent, ResourceLinkDialogProps } from './resource-link-dialog.component';

@Component({
  selector: 'app-resource-list-selection',
  template: `
    <div style="background: #336790; color: white; padding: 0 16px; display: flex; gap: 8px; align-items: center">
      <div style="flex: 1; display: flex; align-items: center; gap: 16px;">
        <div>
          {{ 'pages.dataBrowser.resourceListSelection.resourcesSelected' | translate: { count: count$ | async } }}
        </div>
        @if ((canEdit$ | async) && (multipleViewerService.selectedResources$ | async); as selectedResources) {
          @let sameClass = isSameClass(selectedResources);
          <div
            style="display: inline-block"
            [matTooltip]="'pages.dataBrowser.resourceListSelection.bulkEditSameClass' | translate"
            [matTooltipDisabled]="sameClass">
            <button
              mat-flat-button
              data-cy="bulk-edit-btn"
              [disabled]="!sameClass"
              (click)="openBulkEditDialog(selectedResources)">
              <mat-icon>edit_note</mat-icon>
              {{ 'pages.dataBrowser.resourceListSelection.bulkEdit' | translate }}
            </button>
          </div>
        }
        @if ((showCreateLink$ | async) && (multipleViewerService.selectedResources$ | async); as selectedResources) {
          @if (isCreateLinkButtonDisabled$ | async; as disabledState) {
            <div
              style="display: inline-block"
              [matTooltip]="
                disabledState.reason || ('pages.dataBrowser.resourceListSelection.createLinkObjectTooltip' | translate)
              "
              [matTooltipDisabled]="!disabledState.disabled">
              <button
                mat-flat-button
                (click)="openCreateLinkDialog(selectedResources)"
                [disabled]="disabledState.disabled">
                {{ 'pages.dataBrowser.resourceListSelection.createLinkObject' | translate }}
              </button>
            </div>
          }
        }
      </div>
      <button mat-icon-button (click)="reset()"><mat-icon>close</mat-icon></button>
    </div>
  `,
  styles: ['button[disabled] { background-color: #fff; color: #b8b8b8 }'],
  imports: [AsyncPipe, MatButton, MatIconButton, MatIcon, MatTooltip, TranslatePipe],
})
export class ResourceListSelectionComponent {
  /** Emits once a bulk edit has written values, so the host can reload its results. */
  @Output() bulkEdited = new EventEmitter<string[]>();

  count$ = this.multipleViewerService.selectedResources$.pipe(map(resources => resources.length));
  showCreateLink$ = combineLatest([
    this.count$,
    this.multipleViewerService.selectedResources$,
    this._userService.user$,
    this._userService.isSysAdmin$,
  ]).pipe(
    map(([count, resources, user, isSysAdmin]) => {
      // Must have more than 1 resource selected
      if (count <= 1) return false;

      // Must have user
      if (!user) return false;

      // System Admin can always see the button
      if (isSysAdmin) return true;

      // Get unique project UUIDs from all selected resources
      const projectUuids = [...new Set(resources.map(r => r.attachedToProject))];

      // Check if user has Project Member OR Project Admin rights on ANY of the projects
      // This allows the button to show (possibly disabled) to provide feedback
      return projectUuids.some(projectUuid => UserPermissions.hasProjectMemberRights(user, projectUuid));
    })
  );

  /** Bulk edit needs write access; dsp-api still checks each value. */
  canEdit$ = combineLatest([
    this.multipleViewerService.selectedResources$,
    this._userService.user$,
    this._userService.isSysAdmin$,
  ]).pipe(
    map(([resources, user, isSysAdmin]) => {
      if (!user || resources.length === 0) return false;
      if (isSysAdmin) return true;
      return resources.every(r => UserPermissions.hasProjectMemberRights(user, r.attachedToProject));
    })
  );

  isCreateLinkButtonDisabled$ = this.multipleViewerService.selectedResources$.pipe(
    map(resources => {
      if (resources.length === 0) {
        return {
          disabled: true,
          reason: this._translateService.instant('pages.dataBrowser.resourceListSelection.noResourcesSelected'),
        };
      }

      const projectUuid = resources[0].attachedToProject;
      const allSameProject = resources.every(resource => resource.attachedToProject === projectUuid);

      if (!allSameProject) {
        return {
          disabled: true,
          reason: this._translateService.instant('pages.dataBrowser.resourceListSelection.resourcesMustBeSameProject'),
        };
      }

      return { disabled: false };
    })
  );

  constructor(
    public multipleViewerService: MultipleViewerService,
    private readonly _userService: UserService,
    private readonly _translateService: TranslateService,
    private readonly _dialog: MatDialog
  ) {}

  reset() {
    this.multipleViewerService.reset();
  }

  /** The edited property comes from the class, so every resource must share it. */
  isSameClass(resources: ReadResource[]): boolean {
    return resources.every(resource => resource.type === resources[0].type);
  }

  openBulkEditDialog(resources: ReadResource[]): void {
    this._dialog
      .open<BulkEditDialogComponent, BulkEditDialogProps, BulkEditDialogResult>(BulkEditDialogComponent, {
        data: { resourceIris: resources.map(resource => resource.id) },
        width: '880px',
        maxWidth: '95vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe(changedIris => {
        if (!changedIris?.length) return;
        changedIris.forEach(iri => this.multipleViewerService.notifyResourceChanged(iri));
        this.bulkEdited.emit(changedIris);
      });
  }

  openCreateLinkDialog(resources: ReadResource[]): void {
    const projectUuid = resources[0].attachedToProject;
    this._dialog.open<ResourceLinkDialogComponent, ResourceLinkDialogProps>(ResourceLinkDialogComponent, {
      data: {
        resources,
        projectUuid,
      },
    });
  }
}
