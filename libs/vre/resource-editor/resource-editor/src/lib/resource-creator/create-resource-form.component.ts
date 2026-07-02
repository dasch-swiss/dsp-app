import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  Cardinality,
  Constants,
  CreateResource,
  CreateStillImageExternalFileValue,
  CreateStillImageFileValue,
  CreateStillImageVectorFileValue,
  CreateValue,
  KnoraApiConnection,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ApiConstants, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { PaginatedApiService, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent, LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { CommonInputComponent, InvalidControlScrollDirective } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, map, of, switchMap, take } from 'rxjs';
import { FormValueGroup } from '../properties/properties-display/property-value/form-value-array.type';
import { propertiesTypeMapping } from '../properties/properties-display/property-value/resource-payloads-mapping';
import { FileForm } from '../representation/file-form.type';
import { FileRepresentationType } from '../representation/file-representation.type';
import { fileValueMapping } from '../representation/file-value-mapping';
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
            [projectShortcode]="projectShortcode"
            [properties]="properties"
            [formGroup]="form.controls.properties" />
        }
        <!-- Data-side Resource Rights Statement: license + copyright holder are LOCKED (from the project's
             resource-side legal settings); authorship is pre-filled from the project default for the user
             to confirm or edit. -->
        <h3>{{ 'legal.dataSide.heading' | translate }}</h3>
        <app-create-resource-form-row [label]="'legal.dataSide.license' | translate">
          <div style="display: flex; align-items: center; gap: 4px; padding: 16px 0">
            @if (dataLicenseUrl) {
              <a [href]="dataLicenseUrl" target="_blank" rel="noopener">{{ dataLicenseLabel }}</a>
            } @else {
              <span>{{ dataLicenseLabel || '—' }}</span>
            }
            <mat-icon style="font-size: 16px; height: 16px; width: 16px">lock</mat-icon>
          </div>
        </app-create-resource-form-row>
        <app-create-resource-form-row [label]="'legal.dataSide.copyrightHolder' | translate">
          <div style="display: flex; align-items: center; gap: 4px; padding: 16px 0">
            <span>{{ dataCopyrightHolder || '—' }}</span>
            <mat-icon style="font-size: 16px; height: 16px; width: 16px">lock</mat-icon>
          </div>
        </app-create-resource-form-row>
        <app-create-resource-form-row [label]="'legal.dataSide.authorship' | translate">
          <mat-form-field style="width: 100%">
            <mat-chip-grid #defaultDataAuthorshipGrid [attr.aria-label]="'legal.dataSide.authorship' | translate">
              @for (author of form.controls.resourceAuthorship.value; track $index) {
                <mat-chip-row (removed)="removeDataAuthor($index)">
                  {{ author }}
                  <button
                    type="button"
                    matChipRemove
                    [attr.aria-label]="'legal.dataSide.removeAuthor' | translate: { name: author }">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip-row>
              }
              <input
                data-cy="data-authorship-chips"
                [placeholder]="'resourceEditor.resourceCreator.authorship.placeholder' | translate"
                [matChipInputFor]="defaultDataAuthorshipGrid"
                (matChipInputTokenEnd)="addDataAuthor($event.value); $event.chipInput!.clear()" />
            </mat-chip-grid>
          </mat-form-field>
        </app-create-resource-form-row>
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
  imports: [
    ReactiveFormsModule,
    InvalidControlScrollDirective,
    CreateResourceFormFileComponent,
    CreateResourceFormRowComponent,
    CommonInputComponent,
    CreateResourceFormPropertiesComponent,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingButtonDirective,
    TranslatePipe,
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
    resourceAuthorship: this._fb.control<string[] | null>([]),
  });

  resourceClass!: ResourceClassDefinitionWithPropertyDefinition;
  fileRepresentation: FileRepresentationType | undefined;

  properties!: PropertyInfoValues[];
  loading = true;

  // Resource-side (data) legal info from the project — license + holder are shown locked.
  dataLicenseLabel?: string;
  dataLicenseUrl?: string;
  dataCopyrightHolder?: string;

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
    private _cd: ChangeDetectorRef,
    private _adminApi: AdminAPIApiService,
    private _paginatedApi: PaginatedApiService,
    private _destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this._getResourceProperties();
    this._loadDataSideLegal();
  }

  /**
   * Loads the project's resource-side legal info: the locked license (resolved to a label + CC deed URL)
   * and copyright holder, and pre-fills the authorship with the project default for the user to confirm or edit.
   */
  private _loadDataSideLegal(): void {
    this._adminApi
      .getAdminProjectsShortcodeProjectshortcode(this.projectShortcode)
      .pipe(
        switchMap(response => {
          const project = response.project;
          this.dataCopyrightHolder = project.dataCopyrightHolder;
          if (project.defaultDataAuthorship && project.defaultDataAuthorship.length > 0) {
            // Programmatic seed keeps the control pristine; the user confirms (submits) or edits these.
            this.form.controls.resourceAuthorship.setValue(project.defaultDataAuthorship);
          }
          return project.dataLicense
            ? this._paginatedApi
                .getLicenses(this.projectShortcode)
                .pipe(map(licenses => licenses.find(l => l.id === project.dataLicense)))
            : of(undefined);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(license => {
        this.dataLicenseLabel = license?.labelEn;
        this.dataLicenseUrl = license?.uri;
        this._cd.detectChanges();
      });
  }

  addDataAuthor(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const control = this.form.controls.resourceAuthorship;
    control.setValue([...(control.value ?? []), trimmed]);
    control.markAsDirty();
  }

  removeDataAuthor(index: number): void {
    const control = this.form.controls.resourceAuthorship;
    control.setValue((control.value ?? []).filter((_, i) => i !== index));
    control.markAsDirty();
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
            // Safe cast: the ontology was loaded via OntologyCache.reloadCachedItem above,
            // which always requests allLanguages=true (see OntologyCache.requestItemFromKnora),
            // so dsp-js deserializes property definitions as the WithAllLanguages subclass.
            return {
              guiDef: v,
              propDef: v.propertyDefinition as ResourcePropertyDefinitionWithAllLanguages,
              values: [],
            };
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

    // Per-resource (data-side) authorship: the field is pre-filled with the project default for the
    // user to confirm or edit; persist whatever they confirmed/entered.
    const authorshipControl = this.form.controls.resourceAuthorship;
    if (authorshipControl.value && authorshipControl.value.length > 0) {
      createResource.resourceAuthorship = authorshipControl.value;
    }

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
    } else if (createFile instanceof CreateStillImageFileValue && formFileValue.link!.toLowerCase().endsWith('.svg')) {
      createFile = new CreateStillImageVectorFileValue();
      (createFile as CreateStillImageVectorFileValue).filename = formFileValue.link!;
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
