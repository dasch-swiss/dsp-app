import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KnoraApiConnection, UpdateOntology, UpdateResourceClassCardinality } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { finalize } from 'rxjs/operators';
import { PropertyForm } from '../property-form.type';

export interface AssignPropertyDialogProps {
  ontologyId: string;
  lastModificationDate: string;
  propertyInfo: PropertyInfoObject;
  resClassIri?: string;
  maxGuiOrderProperty: number;
}

@Component({
  selector: 'app-assign-property-dialog',
  template: ` <app-dialog-header
      title="Assign a property to a resource"
      [subtitle]="data.propertyInfo.propType.group + ': ' + data.propertyInfo.propType.label"></app-dialog-header>
    <app-property-form
      mat-dialog-content
      (afterFormInit)="getForm($event)"
      [formData]="{
        resourceClassId: data.resClassIri,
        property: data.propertyInfo,
        name: data.propertyInfo.propDef.label,
        labels: data.propertyInfo.propDef.labels,
        comments:
          data.propertyInfo.propDef.comments.length > 0
            ? data.propertyInfo.propDef.comments
            : [{ language: 'de', value: '' }],
        guiAttribute: data.propertyInfo.propDef.guiAttributes[0]
      }"></app-property-form>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        Submit
      </button>
    </div>`,
})
export class AssignPropertyDialogComponent {
  loading = false;
  form: PropertyForm;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private dialogRef: MatDialogRef<AssignPropertyDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: AssignPropertyDialogProps,
    private _store: Store
  ) {}

  getForm(form: PropertyForm) {
    this.form = form;
    this.form.controls.propType.disable();
    this.form.controls.name.disable();
    this.form.controls.labels.disable();
    this.form.controls.comments.disable();
  }

  onSubmit() {
    this.loading = true;

    const prop = this.data.propertyInfo.propDef;
    const onto = new UpdateOntology<UpdateResourceClassCardinality>();

    onto.lastModificationDate = this.data.lastModificationDate;

    onto.id = this.data.ontologyId;

    const addCard = new UpdateResourceClassCardinality();

    addCard.id = this.data.resClassIri;

    addCard.cardinalities = [
      {
        propertyIndex: prop.id,
        cardinality: this.form.controls.cardinality.value,
        guiOrder: this.data.maxGuiOrderProperty + 1, // TODO this.data.guiOrder, // add new property to the end of current list of properties
      },
    ];

    onto.entity = addCard;

    this._dspApiConnection.v2.onto
      .addCardinalityToResourceClass(onto)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}
