import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { combineLatest, map, tap } from 'rxjs';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ResourceLinkDialogComponent, ResourceLinkDialogProps } from './resource-link-dialog.component';

@Component({
  selector: 'app-resource-list-selection',
  template: `
    <div style="background: #336790; color: white; padding: 0 16px; display: flex; gap: 8px; align-items: center">
      <div style="flex: 1; display: flex; align-items: center; gap: 16px;">
        <div>{{ count$ | async }} resources selected</div>
        @if ((showCreateLink$ | async) && (multipleViewerService.selectedResources$ | async); as selectedResources) {
          <button mat-flat-button (click)="openCreateLinkDialog(selectedResources)">Create a link object</button>
        }
      </div>
      <button mat-icon-button (click)="reset()"><mat-icon>close</mat-icon></button>
    </div>
  `,
  standalone: false,
})
export class ResourceListSelectionComponent {
  count$ = this.multipleViewerService.selectedResources$.pipe(map(resources => resources.length));
  showCreateLink$ = combineLatest([this.count$, this.multipleViewerService.hasRightsToShowCreateLinkObject$]).pipe(
    map(([count, hasProjectMemberRights]) => count > 1 && hasProjectMemberRights)
  );

  constructor(
    public multipleViewerService: MultipleViewerService,
    private _dialog: MatDialog
  ) {}

  reset() {
    this.multipleViewerService.reset();
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
