import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import {
  DefaultProperties,
  LocalizationService,
  PropertyCategory,
  PropertyInfoObject,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/ui/string-literal';
import { PropertyForm } from '../property-form.type';

@Component({
  selector: 'app-property-form',
  template: ` <form [formGroup]="form">
    <mat-form-field style="width: 100%">
      <span matPrefix>
        <mat-icon>{{ selectedProperty.icon }}</mat-icon>
      </span>
      <mat-label>Property type</mat-label>
      <mat-select [formControl]="form.controls.propType">
        <mat-select-trigger>
          {{ selectedProperty.group }}
          :&nbsp; {{ selectedProperty.label }}
        </mat-select-trigger>

        <mat-optgroup *ngFor="let type of filteredProperties" [label]="type.group">
          <mat-option *ngFor="let ele of type.elements" [value]="ele.guiEle">
            <mat-icon>{{ ele.icon }}</mat-icon>
            {{ ele.label }}
          </mat-option>
        </mat-optgroup>
      </mat-select>
    </mat-form-field>
    <app-common-input
      label="Property name"
      data-cy="name-input"
      prefixIcon="fingerprint"
      [control]="form.controls.name" />
    <app-multi-language-input
      [formArray]="form.controls.labels"
      [isRequired]="true"
      data-cy="label-input"
      placeholder="Property label" />

    <app-gui-attr-list
      *ngIf="formData.property.propType.objectType === Constants.ListValue"
      [control]="form.controls.guiAttr" />

    <app-gui-attr-link
      *ngIf="formData.property.propType.objectType === Constants.LinkValue"
      [control]="form.controls.guiAttr" />

    <app-multi-language-textarea
      [formArray]="form.controls.comments"
      data-cy="comment-textarea"
      placeholder="Comment"
      [isRequired]="true" />
  </form>`,
})
export class PropertyFormComponent implements OnInit {
  @Input() formData!: {
    property: PropertyInfoObject;
    resourceClassId: string;
    name?: string;
    labels?: StringLiteralV2[];
    comments?: StringLiteralV2[];
    guiAttribute?: string;
  };
  @Output() afterFormInit = new EventEmitter<PropertyForm>();

  readonly Constants = Constants;
  readonly defaultProperties = DefaultProperties.data;

  form!: PropertyForm;

  filteredProperties!: PropertyCategory[];

  get selectedProperty() {
    const selected = this.defaultProperties
      .flatMap(el => el.elements)
      .find(
        e =>
          e.objectType === this.formData.property.propType.objectType && e.guiEle === this.form.controls.propType.value
      );
    return selected;
  }

  constructor(
    private _fb: FormBuilder,
    private _localizationService: LocalizationService
  ) {}

  ngOnInit() {
    this.filteredProperties = this.defaultProperties.filter(
      property => property.group === this.formData.property.propType.group
    );

    const defaultData = [
      {
        language: this._localizationService.getCurrentLanguage(),
        value: '',
      },
    ];
    this.form = this._fb.group({
      propType: this._fb.control(
        {
          value: this.formData.property.propType.guiEle!,
          disabled: this.filteredProperties[0].elements.length === 1 || !!this.formData.name,
        },
        { nonNullable: true }
      ),
      name: this._fb.control<string>(
        { value: this.formData.name ?? '', disabled: !!this.formData.name },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      labels: DEFAULT_MULTILANGUAGE_FORM(this.formData.labels ?? defaultData, [Validators.required]),
      comments: DEFAULT_MULTILANGUAGE_FORM(this.formData.comments ?? defaultData, [Validators.required]),
      guiAttr: this._fb.control<string>(
        {
          value: this.formData.guiAttribute!,
          disabled:
            !!this.formData.name ||
            ![Constants.LinkValue, Constants.ListValue].includes(this.formData.property.propType.objectType!),
        },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
    });

    this.afterFormInit.emit(this.form);
  }
}
