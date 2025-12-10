import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  Cardinality,
  Constants,
  CreateResource,
  CreateStillImageExternalFileValue,
  CreateStillImageFileValue,
  CreateValue,
  KnoraApiConnection,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ApiConstants, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent, LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { CommonInputComponent, InvalidControlScrollDirective } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { finalize, switchMap, take } from 'rxjs';
import { FileForm } from '../representations/file-form.type';
import { FileRepresentationType } from '../representations/file-representation.type';
import { fileValueMapping } from '../representations/file-value-mapping';
import { FormValueGroup } from '../resource-properties/form-value-array.type';
import { propertiesTypeMapping } from '../resource-properties/resource-payloads-mapping';
import { CreateResourceFormFileComponent } from './create-resource-form-file.component';
import { CreateResourceFormPropertiesComponent } from './create-resource-form-properties.component';
import { CreateResourceFormRowComponent } from './create-resource-form-row.component';
import { CreateResourceFormInterface } from './create-resource-form.interface';

@Component({
  selector: 'app-create-resource-form',
  template: `
    @if (!loading) {
      <form [formGroup]="form" appInvalidControlScroll class="form">
        @if (fileRepresentation) {
          <h3>{{ 'resourceEditor.resourceCreator.form.file' | translate }}</h3>
          <app-create-resource-form-file
            [projectShortcode]="projectShortcode"
            [fileRepresentation]="fileRepresentation"
            (afterFormCreated)="afterFileFormCreated($event)" />
          <h3>{{ 'resourceEditor.resourceCreator.form.properties' | translate }}</h3>
        }
        <app-create-resource-form-row
          [label]="('resourceEditor.resourceCreator.form.resourceLabel' | translate) + ' *'"
          [tooltip]="'resourceEditor.resourceCreator.form.resourceLabelTooltip' | translate"
          data-cy="resource-label">
          <app-common-input
            [control]="form.controls.label"
            [withLabel]="false"
            data-cy="label-input"
            [label]="'resourceEditor.resourceCreator.form.resourceLabelPlaceholder' | translate" />
        </app-create-resource-form-row>
        @if (properties) {
          <app-create-resource-form-properties
            [resourceClassIri]="resourceClassIri"
            [projectIri]="projectIri"
            [properties]="properties"
            [formGroup]="form.controls.properties" />
        }
        <div class="form-actions">
          <button mat-raised-button type="button" data-cy="cancel-button" (click)="onCancel()">
            {{ 'ui.common.actions.cancel' | translate }}
          </button>
          <button
            mat-raised-button
            type="submit"
            color="primary"
            appLoadingButton
            data-cy="submit-button"
            [isLoading]="loading"
            (click)="submitData()">
            {{ 'ui.common.actions.submit' | translate }}
          </button>
        </div>
      </form>
    } @else {
      <app-progress-indicator />
    }
  `,
  styles: [
    '.row { display: flex; padding: 16px 0;}',
    '.grid-h3 {width: 140px; margin-right: 10px; text-align: right; margin-top: 16px; color: rgb(107, 114, 128); cursor: help}',
    '.form { display: block; margin-right: 100px;}',
    '.form-actions { display: flex; justify-content: end; gap: 8px; margin-top: 16px; }',
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InvalidControlScrollDirective,
    CreateResourceFormFileComponent,
    CreateResourceFormRowComponent,
    CommonInputComponent,
    CreateResourceFormPropertiesComponent,
    MatButtonModule,
    LoadingButtonDirective,
    TranslateModule,
    AppProgressIndicatorComponent,
  ],
})
export class CreateResourceFormComponent implements OnInit {
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) projectIri!: string;
  @Input({ required: true }) projectShortcode!: string;

  @Output() createdResourceIri = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup<CreateResourceFormInterface> = this._fb.group({
    label: this._fb.control('', { nonNullable: true, validators: [Validators.required] }),
    properties: this._fb.group({}),
  });

  resourceClass!: ResourceClassDefinitionWithPropertyDefinition;
  fileRepresentation: FileRepresentationType | undefined;

  properties!: PropertyInfoValues[];
  loading = true;

  mapping = new Map<string, string>();
  readonly resourceClassTypes = [
    Constants.HasStillImageFileValue,
    Constants.HasDocumentFileValue,
    Constants.HasAudioFileValue,
    Constants.HasMovingImageFileValue,
    Constants.HasArchiveFileValue,
    Constants.HasTextFileValue,
  ];

  readonly cardinality = Cardinality;

  protected readonly Constants = Constants;

  get ontologyIri() {
    return this.resourceClassIri.split('#')[0];
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: FormBuilder,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._getResourceProperties();
  }

  afterFileFormCreated(fileForm: FileForm) {
    this.form.addControl('file', fileForm);
  }

  submitData() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    this._dspApiConnection.v2.res
      .createResource(this._getPayload())
      .pipe(take(1))
      .subscribe(res => {
        this.createdResourceIri.emit(res.id);
      });
  }

  onCancel() {
    this.cancelled.emit();
  }

  private _getResourceProperties() {
    this._dspApiConnection.v2.ontologyCache
      .reloadCachedItem(this.ontologyIri)
      .pipe(
        switchMap(() => this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(this.resourceClassIri)),
        finalize(() => {
          this.loading = false;
          this._cd.detectChanges();
        })
      )
      .subscribe(onto => {
        this.fileRepresentation = this._getFileRepresentation(onto);
        this.resourceClass = onto.classes[this.resourceClassIri];
        this.properties = this.resourceClass
          .getResourcePropertiesList()
          .filter(v => v.propertyIndex.indexOf(ApiConstants.apiKnoraOntologyUrl))
          .map(v => {
            return { guiDef: v, propDef: v.propertyDefinition, values: [] };
          });

        this._buildForm();
        this._cd.detectChanges();
      });
  }

  private _buildForm() {
    this.properties
      .filter(prop => propertiesTypeMapping.has(prop.propDef.objectType!))
      .forEach(prop => {
        const control = propertiesTypeMapping.get(prop.propDef.objectType!)!.control() as AbstractControl;
        if (prop.guiDef.cardinality === Cardinality._1 || prop.guiDef.cardinality === Cardinality._1_n) {
          control.addValidators(Validators.required);
        }

        this.form.controls.properties.addControl(
          prop.propDef.id,
          this._fb.array([
            this._fb.group({
              item: control,
              comment: null,
            }) as unknown as FormValueGroup,
          ])
        );
        this.mapping.set(prop.propDef.id, prop.propDef.objectType!);
      });
  }

  private _getFileRepresentation(onto: ResourceClassAndPropertyDefinitions) {
    for (const item of this.resourceClassTypes) {
      if (onto.properties[item]) {
        return item as FileRepresentationType;
      }
    }
    return undefined;
  }

  private _getPayload() {
    const createResource = new CreateResource();
    createResource.label = this.form.controls.label.value;
    createResource.type = this.resourceClass.id;
    createResource.properties = this._getPropertiesObj();
    createResource.attachedToProject = this.projectIri;

    return createResource;
  }

  private _getPropertiesObj() {
    const propertiesObj: { [index: string]: CreateValue[] } = {};

    Object.keys(this.form.controls.properties.controls)
      .filter(iri => {
        const hasPropertyControlValue = this.form.controls.properties.controls[iri].controls.some(
          control => control.value.item !== null && control.value.item !== ''
        );

        const optionalItems = this.getOptionalValueItems(
          iri,
          this.form.controls.properties.controls[iri].controls,
          this.properties
        );
        return hasPropertyControlValue === true && optionalItems.length === 0 ? hasPropertyControlValue : false;
      })
      .forEach(iri => {
        propertiesObj[iri] = this._getValue(iri);
      });

    if (this.fileRepresentation && this.form.controls.file!.value) {
      propertiesObj[this.fileRepresentation] = [this._getCreateFileValue()];
    }
    return propertiesObj;
  }

  private _getCreateFileValue() {
    const formFileValue = this.form.controls.file!.getRawValue();
    let createFile = fileValueMapping.get(this.fileRepresentation!)!.create();

    if (createFile instanceof CreateStillImageFileValue && formFileValue.link!.startsWith('http')) {
      createFile = new CreateStillImageExternalFileValue();
      (createFile as CreateStillImageExternalFileValue).externalUrl = formFileValue.link!;
    } else {
      createFile.filename = formFileValue.link!;
    }

    createFile.copyrightHolder = formFileValue.legal.copyrightHolder!;
    createFile.license = formFileValue.legal.license!;
    createFile.authorship = formFileValue.legal.authorship!;

    return createFile;
  }

  private getOptionalValueItems = (iri: string, controls: FormValueGroup[], properties: PropertyInfoValues[]) =>
    controls.filter(group => {
      let hasOptionalBoolean = false;
      if (group.value) {
        const foundProperty = properties.find(property => property.guiDef.propertyIndex === iri);
        hasOptionalBoolean = !!(
          foundProperty &&
          (foundProperty.propDef as ResourcePropertyDefinition).objectType === Constants.BooleanValue &&
          !this.isRequired(foundProperty.guiDef.cardinality) &&
          group.value.item === null
        );
      }
      return hasOptionalBoolean;
    });

  isRequired(cardinality: Cardinality): boolean {
    return [Cardinality._1, Cardinality._1_n].includes(cardinality);
  }

  private _getValue(iri: string) {
    const foundProperty = this.properties.find(property => property.guiDef.propertyIndex === iri);
    if (!foundProperty) throw new Error(`Property ${iri} not found`);
    const propertyDefinition = foundProperty.propDef as ResourcePropertyDefinition;

    const controls = this.form.controls.properties.controls[iri].controls;
    return controls
      .filter(group => group.value.item !== null)
      .map(group => {
        const entity = propertiesTypeMapping
          .get(this.mapping.get(iri)!)!
          .createValue(group.controls.item.value, propertyDefinition);
        if (group.controls.comment.value) {
          entity.valueHasComment = group.controls.comment.value;
        }
        return entity;
      });
  }
}
