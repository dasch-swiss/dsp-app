import { Component, Input, OnChanges } from '@angular/core';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { isSegmentClass } from '../../resource-description';
import { IncomingLinksPropertyComponent } from './incoming-links-property.component';
import { PropertyRowComponent } from './property-value/property-row.component';
import { PropertyValuesWithFootnotesComponent } from './property-value/property-values-with-footnotes.component';
import { StandoffLinksPropertyComponent } from './standoff-links-property.component';

@Component({
  selector: 'app-properties-display',
  template: `
    @if (editableProperties && editableProperties.length > 0) {
      @for (prop of editableProperties; track $index; let last = $last) {
        <app-property-row
          [isEmptyRow]="prop.values.length === 0"
          [borderBottom]="true"
          [tooltip]="prop.propDef.comments | appStringifyStringLiteral"
          [prop]="prop"
          [singleRow]="false"
          [attr.data-cy]="'row-' + prop.propDef.id"
          [label]="
            (prop.propDef.labels | appStringifyStringLiteral) +
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
  imports: [
    PropertyRowComponent,
    PropertyValuesWithFootnotesComponent,
    StandoffLinksPropertyComponent,
    IncomingLinksPropertyComponent,
    StringifyStringLiteralPipe,
  ],
})
export class PropertiesDisplayComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input() linkToNewTab?: string;
  @Input() parentResourceId = '';

  protected readonly cardinality = Cardinality;

  editableProperties: PropertyInfoValues[] = [];

  ngOnChanges() {
    // Every class except Segments shows Description in the resource header instead of this list.
    const showDescriptionRow = isSegmentClass(this.resource.res);
    this.editableProperties = this.resource.resProps.filter(
      prop => prop.propDef.isEditable && (prop.propDef.id !== Constants.HasDescription || showDescriptionRow)
    );
  }
}
