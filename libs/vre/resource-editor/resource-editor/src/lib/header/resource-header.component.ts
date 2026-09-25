import { AsyncPipe } from '@angular/common';
import { Component, Input, OnChanges, ViewContainerRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Constants, ReadResource, ResourceClassDefinitionWithPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyValuesWithFootnotesComponent } from '../properties/properties-display/property-value/property-values-with-footnotes.component';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceUtil } from '../representation/resource.util';
import { showsDescriptionInHeader } from '../resource-description';
import { EditResourceLabelDialogComponent } from './more-menu/edit-resource-label-dialog.component';
import { ResourceInfoBarComponent } from './resource-info-bar.component';
import { ResourceToolbarComponent } from './resource-toolbar.component';

@Component({
  selector: 'app-resource-header',
  template: ` <div class="resource-header">
    <div class="resource-class-header">
      <h3
        [class.label-info]="resourceClassType?.comment"
        [matTooltip]="resourceClassType?.comments | appStringifyStringLiteral"
        matTooltipClass="header-tooltip"
        matTooltipPosition="above">
        {{ resourceClassType?.labels | appStringifyStringLiteral }}
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
          [matTooltip]="'resourceEditor.moreMenu.editLabel' | translate"
          (click)="openEditLabelDialog()">
          <mat-icon>edit</mat-icon>
        </button>
      }
    </div>
    @if (showDescription) {
      <div
        class="resource-description"
        role="group"
        data-cy="resource-header-description"
        [attr.aria-label]="descriptionProp!.propDef.labels | appStringifyStringLiteral">
        <app-property-values-with-footnotes [prop]="descriptionProp!" [resource]="resource.res" />
      </div>
    }
    <app-resource-info-bar [resource]="resource.res" />
  </div>`,
  styles: [
    `
      .resource-header {
        margin-bottom: 24px;
      }

      .resource-description {
        margin-top: 4px;
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
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StringifyStringLiteralPipe,
    TranslatePipe,
    ResourceInfoBarComponent,
    ResourceToolbarComponent,
    PropertyValuesWithFootnotesComponent,
  ],
})
export class ResourceHeaderComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  descriptionProp: PropertyInfoValues | undefined;
  showDescription = false;

  get resourceClassType(): ResourceClassDefinitionWithPropertyDefinition {
    return this.resource.res.entityInfo.classes[this.resource.res.type];
  }

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges(): void {
    // Computed here, not in a getter: a fresh PropertyInfoValues per change-detection cycle
    // would reset PropertyValueService.lastOpenedItem$ inside the descendant edit components.
    this.descriptionProp = showsDescriptionInHeader(this.resource.res)
      ? this.resource.resProps?.find(prop => prop.propDef.id === Constants.HasDescription)
      : undefined;
    this.showDescription =
      !!this.descriptionProp && (this.descriptionProp.values.length > 0 || ResourceUtil.userCanEdit(this.resource.res));
  }

  openEditLabelDialog() {
    this._dialog.open<EditResourceLabelDialogComponent, ReadResource, boolean>(EditResourceLabelDialogComponent, {
      ...DspDialogConfig.smallDialog<ReadResource>(this.resource.res),
      viewContainerRef: this._viewContainerRef,
    });
  }
}
