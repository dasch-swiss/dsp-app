import { ChangeDetectorRef, Injectable } from '@angular/core';
import { FormBuilder, ValidatorFn } from '@angular/forms';
import { AvailableLanguage, AvailableLanguageKeys } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguageFormArray } from './multi-language-form-array.type';

/** Component Provider used in combination with
 * MultiLanguageInputComponent and MultiLanguageTextareaComponent.
 * Those two components have the same business logic (here), but differ in their html.
 */
@Injectable()
export class MultiLanguageFormService {
  readonly availableLanguages = AvailableLanguageKeys;
  selectedLanguageIndex!: number;
  formArray!: MultiLanguageFormArray;
  validators!: ValidatorFn[];

  inputValue: string | null = null;

  get selectedFormControl() {
    const index = this.formArray
      .getRawValue()
      .findIndex(v => v.language === this.availableLanguages[this.selectedLanguageIndex]);
    return this.formArray.controls[index];
  }

  get selectedLanguageControl() {
    return this.selectedFormControl.controls.value;
  }

  get invalidErrors() {
    for (const control of this.formArray.controls) {
      if (control.controls.value.errors) {
        return { language: control.getRawValue().language, error: control.controls.value.errors };
      }
    }
    if (this.formArray.errors) {
      return { error: this.formArray.errors, language: undefined };
    }
    return undefined;
  }

  constructor(
    private readonly _localizationService: LocalizationService,
    private readonly _fb: FormBuilder,
    private readonly _cd: ChangeDetectorRef
  ) {}

  onInit(formArray: MultiLanguageFormArray, validators: ValidatorFn[]) {
    this.formArray = formArray;
    this.selectedLanguageIndex = this._setupLanguageIndex();
    this.validators = validators;

    const newFormControl = this.formArray.controls.find(
      control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
    );

    this.inputValue = newFormControl ? this.selectedLanguageControl.value : null;

    this.formArray.valueChanges.subscribe(array => {
      if (array.length === 0) {
        this.inputValue = null;
        this._cd.detectChanges(); // TODO remove later
      }
    });
  }

  onInputChange(newText: string) {
    if (newText === '') {
      if (this.inputValue && this.inputValue.length > 0) {
        this.formArray.removeAt(this.formArray.controls.indexOf(this.selectedFormControl));
        this.inputValue = null;
      }
      return;
    }

    if (this.inputValue === null) {
      this.formArray.push(
        this._fb.nonNullable.group({
          language: this.availableLanguages[this.selectedLanguageIndex],
          value: [newText, this.validators],
        })
      );
    }

    this.selectedLanguageControl.setValue(newText);
    this.inputValue = newText;
  }

  getFormControlWithLanguage(lang: AvailableLanguage) {
    return this.formArray.controls.find(
      control => control.value.language === lang && (control.value.value?.trim() ?? '') !== ''
    );
  }

  changeLanguage(languageIndex: number) {
    this._cleanEmptyValues();
    this.selectedLanguageIndex = languageIndex;

    const existingControl = this.formArray.controls.find(
      control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
    );

    this.inputValue = existingControl ? this.selectedLanguageControl.value : null;
  }

  private _cleanEmptyValues() {
    this.formArray.getRawValue().forEach((v, index) => {
      if (v.value === '') {
        this.formArray.removeAt(index);
      }
    });
  }

  /**
   * Select the language tab to display initially.
   *
   * Preference order:
   *  1. the user's current UI language, if the form has a non-empty value for it
   *  2. the first language in `availableLanguages` that has a non-empty value
   *  3. the user's current UI language as a fallback (typical create-flow with an
   *     empty form), defaulting to index 0 if the current language is unknown
   */
  private _setupLanguageIndex(): number {
    const currentLanguage = this._localizationService.currentLanguage;
    const currentLanguageIndex = this.availableLanguages.indexOf(currentLanguage);

    if (currentLanguageIndex !== -1 && this.getFormControlWithLanguage(currentLanguage) !== undefined) {
      return currentLanguageIndex;
    }

    const firstAvailableWithValue = this.availableLanguages.findIndex(
      lang => this.getFormControlWithLanguage(lang) !== undefined
    );
    if (firstAvailableWithValue !== -1) {
      return firstAvailableWithValue;
    }

    return Math.max(currentLanguageIndex, 0);
  }
}
