import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { FormValueArray } from '../resource-properties/form-value-array.type';
import { propertiesTypeMapping } from '../resource-properties/resource-payloads-mapping';
import { CreateResourceFormRowComponent } from './create-resource-form-row.component';
import { PropertyValuesCreatorComponent } from './property-values-creator.component';

@Component({
  selector: 'app-create-resource-form-properties',
  template: `
    @for (prop of myProperties; track prop) {
      <div style="border-top: 1px solid rgba(51, 103, 144, .1); padding: 16px 0">
        <app-create-resource-form-row
          [label]="
            prop.propDef.label +
            (prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : '')
          "
          [tooltip]="prop.propDef.comment">
          <app-property-values-creator
            [myProperty]="prop"
            [attr.data-cy]="'creator-row-' + prop.propDef.label"
            [formArray]="formGroup.controls[prop.propDef.id]"
            [resourceClassIri]="resourceClassIri"
            [projectIri]="projectIri"
            [projectShortcode]="projectShortcode" />
        </app-create-resource-form-row>
      </div>
    }
  `,
  styles: [
    `
      app-create-resource-form-row {
        display: block;
        margin-bottom: 8px;
      }
    `,
  ],
  standalone: true,
  imports: [CreateResourceFormRowComponent, PropertyValuesCreatorComponent],
})
export class CreateResourceFormPropertiesComponent {
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) projectIri!: string;
  @Input({ required: true }) projectShortcode!: string;
  @Input({ required: true }) formGroup!: FormGroup<{ [key: string]: FormValueArray }>;
  @Input({ required: true }) properties!: PropertyInfoValues[];

  get myProperties() {
    return this.properties?.filter(prop => propertiesTypeMapping.has(prop.propDef.objectType!)) ?? [];
  }

  protected readonly cardinality = Cardinality;
}
