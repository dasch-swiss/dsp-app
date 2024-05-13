import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Constants,
  DeleteResourcePropertyComment,
  KnoraApiConnection,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourcePropertyComment,
  UpdateResourcePropertyGuiElement,
  UpdateResourcePropertyLabel,
} from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DefaultProperties, PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { SetCurrentOntologyAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { switchMap, tap } from 'rxjs/operators';
import { PropertyForm } from '../property-form.type';

export interface EditPropertyFormDialogProps {
  ontology: ReadOntology;
  lastModificationDate: string;
  propertyInfo: PropertyInfoObject;
  resClassIri?: string;
}

@Component({
  selector: 'app-edit-property-form-dialog',
  template: ` <app-dialog-header
      title="Edit a property"
      [subtitle]="data.propertyInfo.propType.group + ': ' + data.propertyInfo.propType.label"></app-dialog-header>
    <app-property-form
      mat-dialog-content
      (afterFormInit)="form = $event"
      [formData]="{
        property: data.propertyInfo,
        name: data.propertyInfo.propDef.label,
        labels: data.propertyInfo.propDef.labels,
        comments: data.propertyInfo.propDef.comments,
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
export class EditPropertyFormDialogComponent implements OnInit {
  loading = false;
  form: PropertyForm;

  ontology = this.data.ontology;
  lastModificationDate = this.data.lastModificationDate;
  propertyInfo = this.data.propertyInfo;

  unsupportedPropertyType = false; // TODO verify, I have set it to true
  get selectedProperty() {
    return DefaultProperties.data.flatMap(el => el.elements).find(e => e.guiEle === this.form.controls.propType.value);
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private dialogRef: MatDialogRef<EditPropertyFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: EditPropertyFormDialogProps,
    private _store: Store,
    private _notification: NotificationService
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('800px', '');
  }

  onSubmit() {
    // label
    const onto4Label = this.getUpdateOntolgyForPropertyLabel();

    this._dspApiConnection.v2.onto
      .updateResourceProperty(onto4Label)
      .pipe(
        switchMap((propertyLabelResponse: ResourcePropertyDefinitionWithAllLanguages) => {
          const onto4Comment = this.getUpdateOntologyForPropertyComment();

          this.lastModificationDate = propertyLabelResponse.lastModificationDate;
          onto4Comment.lastModificationDate = this.lastModificationDate;

          if (onto4Comment.entity.comments.length) {
            // if the comments array is not empty, send a request to update the comments
            return this._dspApiConnection.v2.onto.updateResourceProperty(onto4Comment).pipe(
              tap((propertyCommentResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                this.lastModificationDate = propertyCommentResponse.lastModificationDate;

                this.final();
              })
            );
          } else {
            // if the comments array is empty, send a request to remove the comments
            const deleteResourcePropertyComment = new DeleteResourcePropertyComment();
            deleteResourcePropertyComment.id = this.propertyInfo.propDef.id;
            deleteResourcePropertyComment.lastModificationDate = this.lastModificationDate;

            return this._dspApiConnection.v2.onto.deleteResourcePropertyComment(deleteResourcePropertyComment).pipe(
              tap((deleteCommentResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                this.lastModificationDate = deleteCommentResponse.lastModificationDate;
                this.final();
              })
            );
          }
        })
      )
      .subscribe(() => {
        this.ontology.lastModificationDate = this.lastModificationDate;
        this._store.dispatch(new SetCurrentOntologyAction(this.ontology));
      });
  }

  private getUpdateOntolgyForPropertyLabel(): UpdateOntology<UpdateResourcePropertyLabel> {
    const onto4Label = new UpdateOntology<UpdateResourcePropertyLabel>();
    onto4Label.id = this.ontology.id;
    onto4Label.lastModificationDate = this.lastModificationDate;

    const updateLabel = new UpdateResourcePropertyLabel();
    updateLabel.id = this.propertyInfo.propDef.id;
    updateLabel.labels = this.form.controls.labels.value as StringLiteralV2[]; // TODO
    onto4Label.entity = updateLabel;
    return onto4Label;
  }

  private getUpdateOntologyForPropertyComment(): UpdateOntology<UpdateResourcePropertyComment> {
    const onto4Comment = new UpdateOntology<UpdateResourcePropertyComment>();
    onto4Comment.id = this.ontology.id;

    const updateComment = new UpdateResourcePropertyComment();
    updateComment.id = this.propertyInfo.propDef.id;
    updateComment.comments = this.form.controls.comments.value as StringLiteralV2[];
    onto4Comment.entity = updateComment;

    return onto4Comment;
  }

  private onSuccess() {
    this.loading = false;
    const msg = `Successfully updated ${this.propertyInfo.propDef.label}.`;
    this._notification.openSnackBar(msg);
    this.dialogRef.close();
  }

  private replaceGuiElement() {
    const onto4guiEle = new UpdateOntology<UpdateResourcePropertyGuiElement>();
    onto4guiEle.id = this.ontology.id;
    onto4guiEle.lastModificationDate = this.lastModificationDate;

    const updateGuiEle = new UpdateResourcePropertyGuiElement();
    updateGuiEle.id = this.propertyInfo.propDef.id;
    updateGuiEle.guiElement = this.selectedProperty.guiEle;
    const guiAttr = false; // TODO it was this.propertyForm.controls['guiAttr'].value;
    if (guiAttr) {
      updateGuiEle.guiAttributes = this.setGuiAttribute(guiAttr);
    }

    onto4guiEle.entity = updateGuiEle;

    this._dspApiConnection.v2.onto
      .replaceGuiElementOfProperty(onto4guiEle)
      .subscribe((guiEleResponse: ResourcePropertyDefinitionWithAllLanguages) => {
        this.lastModificationDate = guiEleResponse.lastModificationDate;
        this.onSuccess();
      });
  }

  private setGuiAttribute(guiAttr: string): string[] {
    let guiAttributes: string[];

    switch (this.propertyInfo.propType.guiEle) {
      case Constants.GuiColorPicker:
        guiAttributes = [`ncolors=${guiAttr}`];
        break;
      case Constants.GuiList:
      case Constants.GuiPulldown:
      case Constants.GuiRadio:
        guiAttributes = [`hlist=<${guiAttr}>`];
        break;
      case Constants.GuiSimpleText:
        // --> TODO could have two guiAttr fields: size and maxlength
        // we suggest to use default value for size; we do not support this guiAttr in DSP-App
        guiAttributes = [`maxlength=${guiAttr}`];
        break;
      case Constants.GuiSpinbox:
        // --> TODO could have two guiAttr fields: min and max
        guiAttributes = [`min=${guiAttr}`, `max=${guiAttr}`];
        break;
      case Constants.GuiTextarea:
        // --> TODO could have four guiAttr fields: width, cols, rows, wrap
        // we suggest to use default values; we do not support this guiAttr in DSP-App
        guiAttributes = ['width=100%'];
        break;
    }

    return guiAttributes;
  }

  private final() {
    // if property type is supported and is of type TextValue and the guiElement is different from its initial value, call replaceGuiElement() to update the guiElement
    // this only works for the TextValue object type currently
    // https://docs.dasch.swiss/latest/DSP-API/03-apis/api-v2/ontology-information/#changing-the-gui-element-and-gui-attributes-of-a-property
    if (
      !this.unsupportedPropertyType &&
      this.propertyInfo.propDef.objectType === Constants.TextValue &&
      this.propertyInfo.propDef.guiElement !== this.selectedProperty.guiEle
    ) {
      this.replaceGuiElement();
    } else {
      this.onSuccess();
    }
  }
}
