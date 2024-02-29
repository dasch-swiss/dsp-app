import { ChangeDetectorRef, Injectable } from '@angular/core';
import { FormBuilder, ValidatorFn } from '@angular/forms';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { DaschLanguage, isDaschLanguage } from './dash-language.type';
import { MultiLanguageFormArray } from './multi-language-form-array.type';

/** Component Provider used in combination with
 * MultiLanguageInputComponent and MultiLanguageTextareaComponent.
 * Those two components have the same business logic (here), but differ in their html.
 */
@Injectable()
export class MultiLanguageFormService {
  readonly availableLanguages: DaschLanguage[] = ['de', 'fr', 'it', 'en', 'rm'];
  selectedLanguageIndex: number;
  formArray: MultiLanguageFormArray;
  validators: ValidatorFn[];

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
    private _store: Store,
    private _fb: FormBuilder,
    private _cd: ChangeDetectorRef
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

  getFormControlWithLanguage(lang: string) {
    return this.formArray.controls.find(control => control.value.language === lang && control.value.value !== '');
  }

  changeLanguage(languageIndex: number) {
    this.selectedLanguageIndex = languageIndex;

    const existingControl = this.formArray.controls.find(
      control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
    );

    this.inputValue = existingControl ? this.selectedLanguageControl.value : null;
  }

  private _setupLanguageIndex(): number {
    const responseLanguages = this.formArray
      .getRawValue()
      .map(v => v.language)
      .filter(language => this.availableLanguages.includes(language));

    const userFavoriteLanguage =
      (this._store.selectSnapshot(UserSelectors.language) as string) || navigator.language.substring(0, 2);

    if (responseLanguages.length === 0) {
      if (!isDaschLanguage(userFavoriteLanguage)) {
        return 0;
      }
      // form is empty, push a new value
      const indexFavoriteLanguage = this.availableLanguages.indexOf(userFavoriteLanguage);

      // with user favorite language
      if (indexFavoriteLanguage !== -1) {
        return indexFavoriteLanguage;
        // with default language
      } else {
        return 0;
      }
    }

    if (
      isDaschLanguage(userFavoriteLanguage) &&
      responseLanguages.includes(userFavoriteLanguage) &&
      this.availableLanguages.includes(userFavoriteLanguage)
    ) {
      return this.availableLanguages.indexOf(userFavoriteLanguage);
    }

    return this.availableLanguages.indexOf(responseLanguages[0]);
  }
}
