import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ApiResponseError,
  Cardinality,
  Constants,
  CreateFileValue,
  CreateResource,
  CreateValue,
  KnoraApiConnection,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { LoadClassItemsCountAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { finalize, switchMap, take } from 'rxjs/operators';
import { FileRepresentationType } from './file-representation.type';
import { fileValueMapping } from './file-value-mapping';
import { FormValueArray, FormValueGroup } from './form-value-array.type';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-create-resource-form',
  template: `
    <form *ngIf="!loading; else loadingTemplate" [formGroup]="form" appInvalidControlScroll>
      <app-upload-2
        *ngIf="form.controls.file && fileRepresentation"
        [formControl]="form.controls.file"
        [representation]="fileRepresentation"
        style="display: block; margin-bottom: 16px;     max-width: 700px;"></app-upload-2>

      <div class="my-grid">
        <div style="display: flex">
          <h3
            class="mat-subtitle-2 my-h3"
            matTooltip="Each resource needs a (preferably unique) label. It will be a kind of resource identifier."
            matTooltipPosition="above">
            Resource label *
          </h3>
          <app-common-input
            [control]="form.controls.label"
            style="flex: 1"
            data-cy="label-input"
            placeholder="Text value"></app-common-input>
        </div>
      </div>

      <div class="my-grid">
        <div class="my-row" *ngFor="let prop of myProperties">
          <h3 class="label mat-subtitle-2" [matTooltip]="prop.propDef.comment" matTooltipPosition="above">
            {{ prop.propDef.label
            }}{{
              prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : ''
            }}
          </h3>
          <div style="flex: 1">
            <app-property-value-switcher
              [myProperty]="prop"
              [formArray]="form.controls.properties.controls[prop.propDef.id]"
              [resourceClassIri]="resourceClassIri"></app-property-value-switcher>
          </div>
        </div>
      </div>
      <div class="my-grid" style="display: flex; justify-content: end">
        <button
          mat-raised-button
          type="submit"
          color="primary"
          appLoadingButton
          data-cy="submit-button"
          [isLoading]="loading"
          (click)="submitData()">
          {{ 'appLabels.form.action.submit' | translate }}
        </button>
      </div>
    </form>

    <ng-template #loadingTemplate>
      <dasch-swiss-app-progress-indicator></dasch-swiss-app-progress-indicator>
    </ng-template>
  `,
  styles: [
    '.my-row { display: flex; border-bottom: 1px solid rgba(33,33,33,.1)}',
    '.my-row:last-child { border-bottom: 0}',
    '.my-grid { width: 600px}',
    '.my-grid h3 {width: 140px; margin-right: 10px; text-align: right; margin-top: 16px}',
    '.label {color: rgb(107, 114, 128); align-self: start; cursor: help; margin-top: 0px; text-align: right;flex-shrink: 0}',
  ],
})
export class CreateResourceFormComponent implements OnInit {
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) projectIri!: string;
  @Input({ required: true }) resourceType!: string;

  @Output() createdResourceIri = new EventEmitter<string>();

  form: FormGroup<{
    label: FormControl<string>;
    properties: FormGroup<{ [key: string]: FormValueArray }>;
    file?: FormControl<CreateFileValue | null>;
  }> = this._fb.group({
    label: this._fb.control('', { nonNullable: true, validators: [Validators.required] }),
    properties: this._fb.group({}),
  });

  resourceClass!: ResourceClassDefinitionWithPropertyDefinition;
  fileRepresentation: FileRepresentationType | undefined;
  properties!: PropertyInfoValues[];
  loading = false;

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

  get ontologyIri() {
    return this.resourceClassIri.split('#')[0];
  }

  get myProperties() {
    return this.properties?.filter(prop => propertiesTypeMapping.has(prop.propDef.objectType!)) ?? [];
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: FormBuilder,
    private _store: Store,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._getResourceProperties();
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
        if (res instanceof ApiResponseError) return;
        this._store.dispatch(new LoadClassItemsCountAction(this.ontologyIri, this.resourceClass.id));
        this.createdResourceIri.emit(res.id);
      });
  }

  private _getResourceProperties() {
    this.loading = true;
    this._dspApiConnection.v2.ontologyCache
      .reloadCachedItem(this.ontologyIri)
      .pipe(
        switchMap(() => this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(this.resourceClassIri)),
        finalize(() => {
          this.loading = false;
          this._cd.detectChanges();
        })
      )
      .subscribe((onto: ResourceClassAndPropertyDefinitions) => {
        this.fileRepresentation = this._getFileRepresentation(onto);

        this.resourceClass = onto.classes[this.resourceClassIri];
        this.properties = this.resourceClass
          .getResourcePropertiesList()
          .filter(v => v.guiOrder !== undefined)
          .map(v => {
            return { guiDef: v, propDef: v.propertyDefinition, values: [] };
          });

        this._buildForm();
        this._cd.detectChanges();
      });
  }

  private _buildForm() {
    if (this.fileRepresentation) {
      this.form.addControl('file', this._fb.control(null, [Validators.required]));
    }

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
              comment: '',
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
    createResource.attachedToProject = this.projectIri;
    createResource.properties = this._getPropertiesObj();
    return createResource;
  }

  private _getPropertiesObj() {
    const propertiesObj: { [index: string]: CreateValue[] } = {};

    Object.keys(this.form.controls.properties.controls)
      .filter(iri => this.form.controls.properties.controls[iri].controls.some(control => control.value.item !== null))
      .forEach(iri => {
        propertiesObj[iri] = this._getValue(iri);
      });

    if (this.fileRepresentation) {
      propertiesObj[this.fileRepresentation] = [this._getFileValue(this.fileRepresentation)];
    }
    return propertiesObj;
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

  private _getFileValue(fileRepresentation: FileRepresentationType) {
    const FileValue = new (fileValueMapping.get(fileRepresentation)!.UploadClass)();
    FileValue.filename = this.form.controls.file!.value!.filename;
    return FileValue;
  }
}
