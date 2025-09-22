import { Component, Input, OnChanges } from '@angular/core';
import { Cardinality, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-properties-display',
  template: `
    @if (!hideToolbar) {
      <div style="display: flex; flex-direction: row-reverse; align-items: center; background: #EAEFF3">
        <div style="display: flex; flex: 0 0 auto">
          <app-properties-toolbar [numberOfComments]="numberOfComments" style="flex-shrink: 0" />
        </div>

        <h3
          style="margin: 0 16px; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
          data-cy="property-header">
          {{ resource.res.label }}
        </h3>
      </div>
    }

    @if (
      ((resourceAttachedUser$ | async) !== undefined && (resourceAttachedUser$ | async) !== null) ||
      resource.res.creationDate
    ) {
      <div class="infobar mat-caption">
        Created
        @if (resourceAttachedUser$ | async; as resourceAttachedUser) {
          by
          {{
            resourceAttachedUser.username
              ? resourceAttachedUser.username
              : resourceAttachedUser.givenName + ' ' + resourceAttachedUser.familyName
          }}
        }
        @if (resource.res.creationDate) {
          <span> on {{ resource.res.creationDate | date }}</span>
        }
      </div>
    }

    @if (editableProperties && editableProperties.length > 0) {
      @for (prop of editableProperties; track $index; let last = $last) {
        <app-property-row
          [isEmptyRow]="prop.values.length === 0"
          [borderBottom]="true"
          [tooltip]="prop.propDef.comment"
          [prop]="prop"
          [singleRow]="false"
          [attr.data-cy]="'row-' + prop.propDef.label"
          [label]="
            prop.propDef.label +
            (prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : '')
          ">
          <app-property-values-with-footnotes [prop]="prop" [resource]="resource.res" />
        </app-property-row>
      }
    } @else {
      <app-property-row label="info" [borderBottom]="false" [isEmptyRow]="false">
        <div>This resource has no defined properties.</div>
      </app-property-row>
    }

    <app-standoff-links-property [resource]="resource" />
    <app-incoming-links-property [resource]="resource.res" />
  `,
  styles: [
    `
      .infobar {
        text-align: right;
        padding-right: 6px;
      }
    `,
  ],
  providers: [PropertiesDisplayService],
})
export class PropertiesDisplayComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input() linkToNewTab?: string;
  @Input() parentResourceId = '';
  @Input() hideToolbar = false;

  protected readonly cardinality = Cardinality;

  editableProperties: PropertyInfoValues[] = [];

  numberOfComments!: number;
  resourceAttachedUser$ = this._resourceFetcherService.attachedUser$;

  constructor(
    public propertiesDisplayService: PropertiesDisplayService,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges() {
    this.editableProperties = this.resource.resProps.filter(
      prop => (prop.propDef as ResourcePropertyDefinition).isEditable
    );

    this.numberOfComments = this.resource.resProps.reduce((acc, prop) => {
      const valuesWithComments = prop.values.reduce(
        (_acc, value) => _acc + (value.valueHasComment === undefined ? 0 : 1),
        0
      );
      return acc + valuesWithComments;
    }, 0);

    if (this.hideToolbar) {
      this.propertiesDisplayService.toggleShowProperties();
    }
  }
}
