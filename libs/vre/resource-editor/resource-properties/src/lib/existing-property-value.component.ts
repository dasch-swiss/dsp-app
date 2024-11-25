import { Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { FormValueArray } from './form-value-array.type';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-existing-property-value',
  template: `
    <app-property-value-switcher
      *ngIf="resource.type"
      [myProperty]="prop"
      [formArray]="formArray"
      [resourceClassIri]="resource.type"
      [editModeData]="{ resource, values: prop.values }"></app-property-value-switcher>
  `,
  styles: [':host { display: block; position: relative; width: 100%}'],
})
export class ExistingPropertyValueComponent implements OnChanges {
  @Input() prop!: PropertyInfoValues;
  @Input() resource!: ReadResource;

  formArray!: FormValueArray;

  constructor(private _fb: FormBuilder) {}

  ngOnChanges() {
    this.formArray = this._fb.array(
      this.prop.values.map(value => {
        const property = propertiesTypeMapping.get(this.prop.propDef.objectType!);
        if (property === undefined) {
          throw new Error(`The property of type ${this.prop.propDef.objectType} is unknown`);
        }
        return this._fb.group({
          item: property.control(value) as AbstractControl,
          comment: this._fb.control(value?.valueHasComment ?? null),
        });
      })
    );
  }
}
