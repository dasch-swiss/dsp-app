import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource, ResourceClassDefinitionWithPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { EditResourceLabelDialogComponent } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-resource-header',
  template: ` <div class="resource-header">
    <div class="resource-class-header">
      <h3
        [class.label-info]="resourceClassType?.comment"
        [matTooltip]="resourceClassType?.comment"
        matTooltipClass="header-tooltip"
        matTooltipPosition="above">
        {{ resourceClassType?.label }}
      </h3>
      <app-resource-toolbar [resource]="resource.res" />
    </div>
    <div class="resource-label" style="display: flex; justify-content: space-between">
      <h4 data-cy="resource-header-label">{{ resource.res.label }}</h4>
      @if (resourceFetcherService.userCanEdit$ | async) {
        <button
          mat-icon-button
          data-cy="edit-label-button"
          color="primary"
          matTooltip="Edit label"
          (click)="openEditLabelDialog()">
          <mat-icon>edit</mat-icon>
        </button>
      }
    </div>
    <app-resource-info-bar [resource]="resource.res" />
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
        align-items: flex-start;
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
  standalone: false,
})
export class ResourceHeaderComponent {
  @Input({ required: true }) resource!: DspResource;

  get resourceClassType(): ResourceClassDefinitionWithPropertyDefinition {
    return this.resource.res.entityInfo.classes[this.resource.res.type];
  }

  constructor(
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  openEditLabelDialog() {
    this._dialog.open<EditResourceLabelDialogComponent, ReadResource, boolean>(EditResourceLabelDialogComponent, {
      ...DspDialogConfig.smallDialog<ReadResource>(this.resource.res),
      viewContainerRef: this._viewContainerRef,
    });
  }
}
