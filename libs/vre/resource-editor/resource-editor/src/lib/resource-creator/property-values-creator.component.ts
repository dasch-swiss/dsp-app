import { ChangeDetectorRef, Component, Input, TemplateRef } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';
import { FormValueArray } from '../resource-properties/form-value-array.type';
import { propertiesTypeMapping } from '../resource-properties/resource-payloads-mapping';
import { TemplateEditorSwitcherComponent } from '../template-switcher/template-editor-switcher.component';
import { PropertyValueCreatorComponent } from './property-value-creator.component';

@Component({
  selector: 'app-property-values-creator',
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="myProperty.propDef"
      [resourceClassIri]="resourceClassIri"
      [projectIri]="projectIri"
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
      <button
        mat-icon-button
        type="button"
        (click)="addEntry()"
        [matTooltip]="'resourceEditor.resourceCreator.propertyValuesCreator.addNewValue' | translate">
        <mat-icon>add_circle</mat-icon>
      </button>
    }
  `,
  standalone: true,
  imports: [
    TemplateEditorSwitcherComponent,
    PropertyValueCreatorComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
})
export class PropertyValuesCreatorComponent {
  @Input({ required: true }) myProperty!: PropertyInfoValues;
  @Input({ required: true }) formArray!: FormValueArray;
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) projectIri!: string;

  template!: TemplateRef<any>;
  Cardinality = Cardinality;

  constructor(
    private readonly _cd: ChangeDetectorRef,
    private readonly _fb: FormBuilder
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
