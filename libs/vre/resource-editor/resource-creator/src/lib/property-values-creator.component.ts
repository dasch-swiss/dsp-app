import { ChangeDetectorRef, Component, Input, TemplateRef } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { FormValueArray, propertiesTypeMapping } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-property-values-creator',
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="myProperty.propDef"
      [resourceClassIri]="resourceClassIri"
      (templateFound)="templateFound($event)" />

    @for (control of formArray.controls; track control; let index = $index) {
      <app-property-value-creator
        [myProperty]="myProperty"
        [formGroup]="control"
        [template]="template"
        [canRemoveValue]="
          (myProperty.guiDef.cardinality === Cardinality._0_n || myProperty.guiDef.cardinality === Cardinality._1_n) &&
          formArray.length > 1
        "
        (removeValue)="removeValue(index)" />
    }

    @if (
      (myProperty.guiDef.cardinality === Cardinality._0_n || myProperty.guiDef.cardinality === Cardinality._1_n) &&
      formArray.controls[formArray.controls.length - 1].value.item !== null
    ) {
      <button mat-icon-button type="button" (click)="addEntry()" [matTooltip]="'Add new value'">
        <mat-icon>add_circle</mat-icon>
      </button>
    }
  `,
  standalone: false,
})
export class PropertyValuesCreatorComponent {
  @Input({ required: true }) myProperty!: PropertyInfoValues;
  @Input({ required: true }) formArray!: FormValueArray;
  @Input({ required: true }) resourceClassIri!: string;

  template!: TemplateRef<any>;
  Cardinality = Cardinality;

  constructor(
    private _cd: ChangeDetectorRef,
    private _fb: FormBuilder
  ) {}

  templateFound(template: TemplateRef<any>) {
    this.template = template;
    this._cd.detectChanges();
  }

  addEntry() {
    const propertyType = propertiesTypeMapping.get(this.myProperty.propDef.objectType!)!;

    const formGroup = this._fb.group({
      item: propertyType.control(propertyType.newValue) as AbstractControl,
      comment: this._fb.control(null),
    });

    this.formArray.push(formGroup);
  }

  removeValue(index: number) {
    this.formArray.removeAt(index);
  }
}
