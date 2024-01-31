import { ChangeDetectorRef, ElementRef, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

/** Component Provider used in combination with
 * MultiLanguageInputComponent and MultiLanguageTextareaComponent.
 * Those two components have the same business logic (here), but differ in their html.
 */
@Injectable()
export class MultiLanguageFormService {
  readonly availableLanguages = ['de', 'fr', 'it', 'en', 'rm'];
  selectedLanguageIndex: number;
  formGroup: FormGroup;
  controlName: string;
  validators: ValidatorFn[];

  inputValue: string | null = null;

  get formArray() {
    return this.formGroup.controls[this.controlName] as FormArray;
  }

  get selectedFormControl(): FormControl {
    return (
      this.formArray.controls.find(
        control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
      ) as FormControl
    ) // TODO as FormControl = bad pattern, should be refactored, also form should be with Typed values
      .get('value') as FormControl;
  }

  get invalidErrors() {
    for (const control of this.formArray.controls) {
      if (control.get('value')?.errors) {
        return { language: control.value.language, error: control.get('value')?.errors };
      }
    }
    if (this.formArray.errors) {
      return { error: this.formArray.errors };
    }
    return undefined;
  }

  constructor(
    private _store: Store,
    private _fb: FormBuilder,
    private _cd: ChangeDetectorRef
  ) {}

  onInit(formGroup: FormGroup, controlName: string, validators: ValidatorFn[]) {
    this.formGroup = formGroup;
    this.controlName = controlName;
    this.selectedLanguageIndex = this._setupLanguageIndex();
    this.validators = validators;

    const newFormControl = this.formArray.controls.find(
      control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
    );

    this.inputValue = newFormControl ? this.selectedFormControl.value : null;

    this.formArray.valueChanges.subscribe(array => {
      if (array.length === 0) {
        this.inputValue = null;
        this._cd.detectChanges(); // TODO remove later
      }
    });
  }

  onInputChange(newText: any) {
    if (newText === '') {
      if (this.inputValue && this.inputValue.length > 0) {
        this.formArray.removeAt(this.formArray.controls.indexOf(this.selectedFormControl));
        this.inputValue = null;
      }
      return;
    }

    if (this.inputValue === null) {
      this.formArray.push(
        this._fb.group({
          language: this.availableLanguages[this.selectedLanguageIndex],
          value: [newText, this.validators],
        })
      );
    }

    this.selectedFormControl.setValue(newText);
    this.inputValue = newText;
  }

  getFormControlWithLanguage(lang: string) {
    return this.formArray.controls.find(control => control.value.language === lang && control.value.value !== '');
  }

  changeLanguage(languageIndex: number) {
    this.selectedLanguageIndex = languageIndex;

    const newFormControl = this.formArray.controls.find(
      control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
    );

    this.inputValue = newFormControl ? this.selectedFormControl.value : null;
  }

  private _setupLanguageIndex(): number {
    const responseLanguages = (this.formArray.value as { language: string }[])
      .map(v => v.language)
      .filter(language => this.availableLanguages.includes(language));

    const userFavoriteLanguage =
      (this._store.selectSnapshot(UserSelectors.language) as string) || navigator.language.substring(0, 2);

    if (responseLanguages.length === 0) {
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

    if (responseLanguages.includes(userFavoriteLanguage) && this.availableLanguages.includes(userFavoriteLanguage)) {
      return this.availableLanguages.indexOf(userFavoriteLanguage);
    }

    return this.availableLanguages.indexOf(responseLanguages[0]);
  }
}
