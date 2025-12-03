import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { ensureWithDefaultLanguage } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { existingNamesAsyncValidator } from '@dasch-swiss/vre/pages/user-settings/user';
import { DefaultProperties, LocalizationService, PropertyCategory } from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/ui/string-literal';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { PropertyForm, EditPropertyDialogData } from './property-form.type';

@Component({
  selector: 'app-property-form',
  template: ` <form [formGroup]="form">
    <mat-form-field style="width: 100%">
      <span matPrefix>
        <mat-icon>{{ propertyData.propType.icon }}</mat-icon>
      </span>
      <mat-label>{{ 'pages.ontology.propertyForm.type' | translate }}</mat-label>
      <mat-select [formControl]="form.controls.guiElement">
        <mat-select-trigger>
          {{ propertyData.propType.group }}
          :&nbsp; {{ propertyData.propType.label }}
        </mat-select-trigger>

        @for (type of filteredProperties; track type) {
          <mat-optgroup [label]="type.group">
            @for (ele of type.elements; track ele) {
              <mat-option [value]="ele.guiElement">
                <mat-icon>{{ ele.icon }}</mat-icon>
                {{ ele.label }}
              </mat-option>
            }
          </mat-optgroup>
        }
      </mat-select>
    </mat-form-field>
    <app-common-input
      [label]="'pages.ontology.propertyForm.name' | translate"
      data-cy="name-input"
      prefixIcon="fingerprint"
      [control]="form.controls.name" />
    <app-multi-language-input
      [formArray]="form.controls.labels"
      [isRequired]="true"
      data-cy="label-input"
      [placeholder]="'pages.ontology.propertyForm.labelPlaceholder' | translate" />

    @if (propertyData.propType.objectType === Constants.ListValue) {
      <app-gui-attr-list data-cy="object-attribute-list" [control]="form.controls.guiAttr" />
    }

    @if (propertyData.propType.objectType === Constants.LinkValue) {
      <app-gui-attr-link data-cy="object-attribute-link" [control]="form.controls.objectType" />
    }

    <app-multi-language-textarea
      [formArray]="form.controls.comments"
      data-cy="comment-textarea"
      [placeholder]="'pages.ontology.propertyForm.commentPlaceholder' | translate"
      [isRequired]="true" />
  </form>`,
  standalone: false,
})
export class PropertyFormComponent implements OnInit {
  @Input() propertyData!: EditPropertyDialogData;
  @Output() afterFormInit = new EventEmitter<PropertyForm>();

  readonly Constants = Constants;
  readonly defaultProperties = DefaultProperties.data;

  form!: PropertyForm;

  filteredProperties!: PropertyCategory[];

  get disableGuiAttributeField(): boolean {
    return !!this.propertyData.name || this.propertyData.propType.objectType !== Constants.ListValue;
  }

  get disableObjectTypeField(): boolean {
    // only link and ispartof properties already existing property can not change the objectClass
    return !!this.propertyData.name || this.propertyData.propType.objectType !== Constants.LinkValue;
  }

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _localizationService: LocalizationService,
    private readonly _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this.filteredProperties = this.defaultProperties.filter(
      property => property.group === this.propertyData.propType.group
    );

    const defaultData = [
      {
        language: this._localizationService.getCurrentLanguage(),
        value: '',
      },
    ];
    this.form = this._fb.group({
      guiElement: this._fb.control(
        {
          value: this.propertyData.propType.guiElement!,
          disabled: true,
        },
        { nonNullable: true }
      ),
      name: this._fb.control(
        {
          value: this.propertyData.name ?? '',
          disabled: !!this.propertyData.name,
        },
        {
          nonNullable: true,
          validators: [Validators.required],
          asyncValidators: [existingNamesAsyncValidator(this._oes.currentOntologyEntityNames$)],
        }
      ),
      labels: DEFAULT_MULTILANGUAGE_FORM(
        this.propertyData.label
          ? ensureWithDefaultLanguage(this.propertyData.label, this._localizationService.getCurrentLanguage())
          : defaultData,
        [Validators.required]
      ),
      comments: DEFAULT_MULTILANGUAGE_FORM(
        this.propertyData.comment
          ? ensureWithDefaultLanguage(this.propertyData.comment, this._localizationService.getCurrentLanguage())
          : defaultData,
        [Validators.required]
      ),
      guiAttr: this._fb.control<string>(
        {
          value: this.propertyData.guiAttribute!,
          disabled: this.disableGuiAttributeField,
        },
        { nonNullable: true, validators: [Validators.required] }
      ),
      objectType: this._fb.control<string>(
        {
          value: this.propertyData.objectType!,
          disabled: this.disableObjectTypeField,
        },
        { nonNullable: true, validators: [Validators.required] }
      ),
    });

    this.afterFormInit.emit(this.form);
  }
}
