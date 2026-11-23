import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { BulkEditLauncher } from '../bulk-edit/bulk-edit-launcher.service';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ResourceLinkDialogComponent, ResourceLinkDialogProps } from './resource-link-dialog.component';

@Component({
  selector: 'app-resource-list-selection',
  template: `
    <div class="selection-bar" data-cy="selection-bar">
      <b class="count">
        {{ 'pages.dataBrowser.resourceListSelection.resourcesSelected' | translate: { count: count$ | async } }}
      </b>
      <button mat-button type="button" data-cy="clear-selection-btn" (click)="reset()">
        {{ 'pages.dataBrowser.resourceListSelection.clearSelection' | translate }}
      </button>
      <span class="spacer"></span>
      <div class="actions">
        @if ((showCreateLink$ | async) && (multipleViewerService.selectedResources$ | async); as selectedResources) {
          @if (isCreateLinkButtonDisabled$ | async; as disabledState) {
            <div
              style="display: inline-block"
              [matTooltip]="
                disabledState.reason || ('pages.dataBrowser.resourceListSelection.createLinkObjectTooltip' | translate)
              "
              [matTooltipDisabled]="!disabledState.disabled">
              <button
                mat-stroked-button
                (click)="openCreateLinkDialog(selectedResources)"
                [disabled]="disabledState.disabled">
                {{ 'pages.dataBrowser.resourceListSelection.createLinkObject' | translate }}
              </button>
            </div>
          }
        }
        <!-- The host's actions for the same selection, e.g. Download. -->
        <ng-content />
        @if (multipleViewerService.selectedResources$ | async; as selectedResources) {
          @let canEdit = (canEdit$ | async) === true;
          @let sameClass = isSameClass(selectedResources);
          <div
            style="display: inline-block"
            [matTooltip]="
              (canEdit
                ? 'pages.dataBrowser.resourceListSelection.bulkEditSameClass'
                : 'pages.dataBrowser.resourceListSelection.bulkEditNoRights'
              ) | translate
            "
            [matTooltipDisabled]="canEdit && sameClass">
            <button
              mat-flat-button
              class="tonal"
              data-cy="bulk-edit-btn"
              [disabled]="!canEdit || !sameClass"
              (click)="openBulkEditDialog(selectedResources)">
              <mat-icon>edit_note</mat-icon>
              {{ 'pages.dataBrowser.resourceListSelection.bulkEdit' | translate }}
              <span class="count-badge" data-cy="bulk-edit-count">{{ selectedResources.length }}</span>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .selection-bar {
        /* Dense: the bar sits between the toolbar and the results, so it stays one slim line. */
        --mat-button-filled-container-height: 28px;
        --mat-button-outlined-container-height: 28px;
        --mat-button-text-container-height: 28px;
        --mat-button-filled-horizontal-padding: 10px;
        --mat-button-outlined-horizontal-padding: 10px;
        --mat-button-text-horizontal-padding: 8px;
        --mat-button-filled-label-text-size: 13px;
        --mat-button-outlined-label-text-size: 13px;
        --mat-button-text-label-text-size: 13px;
        --mat-button-filled-icon-spacing: 6px;
        --mat-button-outlined-icon-spacing: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 24px;
        background: #eaf1f7;
        border-bottom: 1px solid #c9d8e5;
        font-size: 13px;
        white-space: nowrap;
      }
      .selection-bar > * {
        flex: none;
      }
      .count {
        font-weight: 500;
      }
      .selection-bar > .spacer {
        flex: 1;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tonal:not([disabled]) {
        background-color: #d6e0e8;
        color: #264c6a;
      }
      .mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
      .count-badge {
        /* Aligned to the text's top, the pill is centred on the label's line box. */
        display: inline-block;
        vertical-align: text-top;
        margin-left: 6px;
        padding: 0 6px;
        border-radius: 8px;
        background: #e8eef4;
        color: #336790;
        font-size: 11px;
        line-height: 16px;
      }
    `,
  ],
  imports: [AsyncPipe, MatButton, MatIcon, MatTooltip, TranslatePipe],
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
    private readonly _dialog: MatDialog,
    private readonly _bulkEditLauncher: BulkEditLauncher
  ) {}

  reset() {
    this.multipleViewerService.reset();
  }

  /** The edited property comes from the class, so every resource must share it. */
  isSameClass(resources: ReadResource[]): boolean {
    return resources.every(resource => resource.type === resources[0].type);
  }

  openBulkEditDialog(resources: ReadResource[]): void {
    this._bulkEditLauncher.open(resources.map(resource => resource.id)).subscribe(changedIris => {
      changedIris?.forEach(iri => this.multipleViewerService.notifyResourceChanged(iri));
      if (changedIris?.length) this.bulkEdited.emit(changedIris);
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
