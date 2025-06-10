import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Constants,
  CreateResourceProperty,
  IHasProperty,
  KnoraApiConnection,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { PropertyForm } from '@dasch-swiss/vre/resource-editor/property-form';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { finalize, switchMap } from 'rxjs/operators';

export interface CreatePropertyFormDialogProps {
  ontologyId: string;
  lastModificationDate: string;
  propertyInfo: PropertyInfoObject;
  maxGuiOrderProperty: number;
  resClassIri: string;
}

@Component({
  selector: 'app-create-property-form-dialog',
  template: ` <app-dialog-header
      title="Create a new property"
      [subtitle]="data.propertyInfo.propType.group + ': ' + data.propertyInfo.propType.label" />
    <app-property-form
      mat-dialog-content
      (afterFormInit)="onFormInit($event)"
      [formData]="{ resourceClassId: data.resClassIri, property: data.propertyInfo }" />
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        data-cy="submit-button"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form?.invalid"
        (click)="onSubmit()">
        Submit
      </button>
    </div>`,
})
export class CreatePropertyFormDialogComponent {
  loading = false;
  form!: PropertyForm;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private dialogRef: MatDialogRef<CreatePropertyFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: CreatePropertyFormDialogProps
  ) {}

  onFormInit(form: PropertyForm) {
    form.controls.propType.disable();
    this.form = form;
  }

  onSubmit() {
    this.loading = true;

    this._dspApiConnection.v2.onto
      .createResourceProperty(this.getOntologyForNewProperty())
      .pipe(
        switchMap(response => this.assignProperty(response)),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }

  assignProperty(prop: ResourcePropertyDefinitionWithAllLanguages) {
    const onto = new UpdateOntology<UpdateResourceClassCardinality>();

    onto.lastModificationDate = prop.lastModificationDate;
    onto.id = this.data.ontologyId;

    const addCard = new UpdateResourceClassCardinality();
    addCard.id = this.data.resClassIri;
    addCard.cardinalities = [];

    const propCard: IHasProperty = {
      propertyIndex: prop.id,
      cardinality: 1, // default: not required, not multiple
      guiOrder: this.data.maxGuiOrderProperty + 1,
    };

    addCard.cardinalities.push(propCard);

    onto.entity = addCard;

    return this._dspApiConnection.v2.onto.addCardinalityToResourceClass(onto);
  }

  private getOntologyForNewProperty(): UpdateOntology<CreateResourceProperty> {
    const onto = new UpdateOntology<CreateResourceProperty>();

    onto.id = this.data.ontologyId;
    onto.lastModificationDate = this.data.lastModificationDate;

    // prepare payload for property
    const newResProp = new CreateResourceProperty();
    newResProp.name = this.form.controls.name.value;
    newResProp.label = this.form.getRawValue().labels;
    newResProp.comment = this.form.getRawValue().comments;

    const guiAttr = this.form.controls.guiAttr.value;
    if (guiAttr) {
      newResProp.guiAttributes = this.setGuiAttribute(guiAttr);
    }

    newResProp.guiElement = this.data.propertyInfo.propType.guiEle;
    newResProp.subPropertyOf = [this.data.propertyInfo.propType.subPropOf];

    if ([Constants.HasLinkTo, Constants.IsPartOf].includes(this.data.propertyInfo.propType.subPropOf)) {
      newResProp.objectType = guiAttr;
      if (Constants.IsPartOf === this.data.propertyInfo.propType.subPropOf) {
        // only restrict the property to a class when it is an IsPartOf
        newResProp.subjectType = this.data.resClassIri;
      }
    } else {
      newResProp.objectType = this.data.propertyInfo.propType.objectType;
    }

    onto.entity = newResProp;
    return onto;
  }

  private setGuiAttribute(guiAttr: string): string[] | undefined {
    switch (this.data.propertyInfo.propType.guiEle) {
      case Constants.GuiColorPicker:
        return [`ncolors=${guiAttr}`];
      case Constants.GuiList:
      case Constants.GuiPulldown:
      case Constants.GuiRadio:
        return [`hlist=<${guiAttr}>`];
      case Constants.GuiSimpleText:
        // --> TODO could have two guiAttr fields: size and maxlength
        // we suggest to use default value for size; we do not support this guiAttr in DSP-App
        return [`maxlength=${guiAttr}`];
      case Constants.GuiSpinbox:
        // --> TODO could have two guiAttr fields: min and max
        return [`min=${guiAttr}`, `max=${guiAttr}`];
      case Constants.GuiTextarea:
        // --> TODO could have four guiAttr fields: width, cols, rows, wrap
        // we suggest to use default values; we do not support this guiAttr in DSP-App
        return ['width=100%'];
    }

    return undefined;
  }
}
