import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PermissionUtil, ResourceClassDefinitionWithPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspDialogConfig } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  EditResourceLabelDialogComponent,
  EditResourceLabelDialogProps,
} from '@dasch-swiss/vre/shared/app-resource-properties';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-resource-header',
  template: ` <div class="resource-header">
    <div class="resource-class-header">
      <h3
        [class.label-info]="resourceClassType?.comment"
        [matTooltip]="resourceClassType?.comment"
        matTooltipClass="header-tooltip"
        matTooltipPosition="above">
        {{ resourceClassType?.label }}<span *ngIf="resource.res.isDeleted">(deleted)</span>
      </h3>
      <app-resource-toolbar
        [resource]="resource"
        [lastModificationDate]="resource.res.lastModificationDate"
        [adminPermissions]="isAdmin$ | async"
        [showEditLabel]="false"></app-resource-toolbar>
    </div>
    <div class="resource-label" style="display: flex; justify-content: space-between">
      <h4>{{ resource.res.label }}</h4>
      <button
        mat-icon-button
        color="primary"
        matTooltip="Edit label"
        (click)="openEditLabelDialog()"
        *ngIf="userCanEdit">
        <mat-icon>edit</mat-icon>
      </button>
    </div>
    <app-resource-info-bar [resource]="resource"></app-resource-info-bar>
  </div>`,
  styles: [
    `
      .resource-header {
        margin-bottom: 24px;
      }

      .resource-label h4 {
        display: inline-block;
        font-weight: 500;
        font-size: 18px;
        line-height: 22px;
        margin-bottom: 0;
        margin-block-start: 0;
        margin-block-end: 0;
        padding-top: 16px;
      }

      .resource-class-header {
        display: flex;
        box-sizing: border-box;
        flex-direction: row;
        align-items: left;
        justify-content: space-between;

        h3.label-info {
          cursor: help;
        }

        h3 {
          display: inline-block;
          text-transform: uppercase;
          font-size: 16px;
          font-weight: normal;
          letter-spacing: 1.25px;
          margin-block-end: 0em;
        }

        .action {
          display: inline-block;
          white-space: nowrap;

          button {
            border-radius: 0;
          }
        }
      }
    `,
  ],
})
export class ResourceHeaderComponent {
  @Input({ required: true }) resource: DspResource;

  get resourceClassType(): ResourceClassDefinitionWithPropertyDefinition {
    return this.resource.res.entityInfo.classes[this.resource.res.type];
  }

  get userCanEdit(): boolean {
    if (!this.resource.res) {
      return false;
    }

    const allPermissions = PermissionUtil.allUserPermissions(
      this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
    );
    return allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
  }

  get attachedToProjectResource(): string {
    return this.resource.res.attachedToProject;
  }

  isAdmin$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    map(([user, userProjectGroups]) => {
      return this.attachedToProjectResource
        ? ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, this.attachedToProjectResource)
        : false;
    })
  );

  constructor(
    private _dialog: MatDialog,
    private _store: Store
  ) {}

  openEditLabelDialog() {
    this._dialog.open<EditResourceLabelDialogComponent, EditResourceLabelDialogProps, boolean>(
      EditResourceLabelDialogComponent,
      DspDialogConfig.smallDialog<EditResourceLabelDialogProps>({ resource: this.resource.res })
    );
  }
}
