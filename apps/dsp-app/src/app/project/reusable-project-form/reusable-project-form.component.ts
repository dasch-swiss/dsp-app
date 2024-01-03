import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { existingNamesValidator } from '../../main/directive/existing-name/existing-name.directive';
import { arrayLengthGreaterThanZeroValidator } from './array-length-greater-than-zero-validator';
import { atLeastOneStringRequired } from './at-least-one-string-required.validator';
import PROJECT_FORM_CONSTANTS from './reusable-project-form.constants';

@Component({
  selector: 'app-reusable-project-form',
  template: `
    <form *ngIf="form" [formGroup]="form">
      <div style="display: flex">
        <app-common-input
          [formGroup]="form"
          controlName="shortcode"
          [placeholder]="'appLabels.form.project.general.shortcode' | translate"
          [validatorErrors]="[shortcodePatternError]"
          style="flex: 1; margin-right: 16px"></app-common-input>

        <app-common-input
          [formGroup]="form"
          controlName="shortname"
          [placeholder]="'appLabels.form.project.general.shortname' | translate"
          style="flex: 1"></app-common-input>
      </div>

      <app-common-input
        [placeholder]="'appLabels.form.project.general.longname' | translate"
        controlName="longname"
        [formGroup]="form"></app-common-input>

      <dasch-swiss-multi-language-textarea
        [placeholder]="('appLabels.form.project.general.description' | translate) + '*'"
        [formGroup]="form"
        controlName="description">
      </dasch-swiss-multi-language-textarea>

      <app-chip-list-input
        [keywords]="form.controls.keywords.value"
        [formGroup]="form"
        controlName="keywords"
        editable="true"></app-chip-list-input>
    </form>
  `,
})
export class ReusableProjectFormComponent implements OnInit, OnDestroy {
  @Input() formData: {
    shortcode: string;
    shortname: string;
    longname: string;
    description: StringLiteral[];
    keywords: string[];
  };
  @Output() formValueChange = new EventEmitter<FormGroup>();
  form: FormGroup;
  shortcodePatternError = { errorKey: 'pattern', message: 'This field must contains letters from A to F and 0 to 9' };
  subscription: Subscription;

  constructor(private _fb: FormBuilder) {}

  ngOnInit() {
    this._buildForm();

    this.subscription = this.form.valueChanges.pipe(startWith(null)).subscribe(z => {
      this.formValueChange.emit(this.form);
    });
  }

  private _buildForm() {
    this.form = this._fb.group({
      shortcode: [
        { value: this.formData.shortcode, disabled: this.formData.shortcode !== '' },
        [
          Validators.required,
          Validators.minLength(PROJECT_FORM_CONSTANTS.shortcodeMinLength),
          Validators.maxLength(PROJECT_FORM_CONSTANTS.shortcodeMaxLength),
          existingNamesValidator(PROJECT_FORM_CONSTANTS.existingShortcodes),
          Validators.pattern(PROJECT_FORM_CONSTANTS.shortcodeRegex),
        ],
      ],
      shortname: [
        { value: this.formData.shortname, disabled: this.formData.shortname !== '' },
        [
          Validators.required,
          Validators.minLength(PROJECT_FORM_CONSTANTS.shortnameMinLength),
          Validators.maxLength(PROJECT_FORM_CONSTANTS.shortnameMaxLength),
          existingNamesValidator(PROJECT_FORM_CONSTANTS.existingShortNames),
          Validators.pattern(PROJECT_FORM_CONSTANTS.shortnameRegex),
        ],
      ],
      longname: [this.formData.longname, [Validators.required]],
      description: this._fb.array(
        this.formData.description.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, [Validators.maxLength(2000)]],
          })
        ),
        atLeastOneStringRequired('value')
      ),
      keywords: [this.formData.keywords, arrayLengthGreaterThanZeroValidator()],
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
