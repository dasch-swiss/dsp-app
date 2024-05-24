import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-values',
  template: ` <div
      *ngFor="let group of propertyValueService.formArray.controls; let index = index"
      style="display: flex">
      <app-property-value style="width: 100%" [itemTpl]="itemTpl" [index]="index"></app-property-value>
    </div>
    <button
      mat-icon-button
      (click)="addItem()"
      *ngIf="
        (isCurrentProjectAdminOrSysAdmin$ | async) &&
        (!propertyValueService.currentlyAdding || propertyValueService.keepEditMode) &&
        (propertyValueService.formArray.controls.length === 0 ||
          [Cardinality._0_n, Cardinality._1_n].includes(propertyValueService.cardinality)) &&
        propertyValueService.propertyDefinition.isEditable
      ">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px">add_box</mat-icon>
    </button>`,
})
export class PropertyValuesComponent implements OnInit {
  @Input() itemTpl!: TemplateRef<any>;

  @Select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin) isCurrentProjectAdminOrSysAdmin$!: Observable<boolean>;

  protected readonly Cardinality = Cardinality;

  constructor(
    public propertyValueService: PropertyValueService,
    private _fb: FormBuilder
  ) {}

  ngOnInit() {
    if (!this.propertyValueService.formArray) {
      throw new Error('The form array should not be empty.');
    }
  }

  addItem() {
    this.propertyValueService.formArray.push(
      this._fb.group({
        item: propertiesTypeMapping
          .get(this.propertyValueService.propertyDefinition.objectType!)!
          .control() as AbstractControl,
        comment: this._fb.control(''),
      })
    );
    this.propertyValueService.toggleOpenedValue(this.propertyValueService.formArray.length - 1);
    this.propertyValueService.currentlyAdding = true;
  }
}
