import { ElementRef, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

@Injectable()
export class MultiLanguageFormService {
  selectedLanguageIndex: number;
  availableLanguages: string[] = ['de', 'fr', 'it', 'en', 'rm'];
  formGroup: FormGroup;
  controlName: string;

  get formArray() {
    return this.formGroup.controls[this.controlName] as FormArray;
  }

  get selectedFormControl() {
    return (
      this.formArray.controls.find(
        control => control.value.language === this.availableLanguages[this.selectedLanguageIndex]
      ) as FormControl
    ).get('value') as FormControl;
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
    private _fb: FormBuilder
  ) {}

  onInit(formGroup: FormGroup, controlName: string) {
    this.formGroup = formGroup;
    this.controlName = controlName;
    this.selectedLanguageIndex = this._setupLanguageIndex();
  }

  getFormControlWithLanguage(lang: string) {
    return this.formArray.controls.find(control => control.value.language === lang && control.value.value !== '');
  }

  changeLanguage(languageIndex: number) {
    const language = this.availableLanguages[languageIndex];
    const languageFoundIndex = this.formArray.value.findIndex(array => array.language === language);

    if (languageFoundIndex === -1) {
      this.formArray.push(
        this._fb.group({
          language,
          value: ['', (this.formArray.controls[0].get('value') as FormControl).validator],
        })
      );
      this.changeLanguage(languageIndex);
    } else {
      this.selectedLanguageIndex = languageIndex;
    }
  }

  private _setupLanguageIndex(): number {
    const commonEntries = (this.formArray.value as { language: string }[])
      .map(v => v.language)
      .filter((itemA: string) => this.availableLanguages.includes(itemA));

    if (commonEntries.length === 0) {
      this.formArray.push(this._fb.group({ language: this.availableLanguages[0], value: '' }));
      return 0;
    }

    const userLanguage =
      (this._store.selectSnapshot(UserSelectors.language) as string) || navigator.language.substring(0, 2);

    if (commonEntries.includes(userLanguage)) {
      return this.availableLanguages.indexOf(userLanguage);
    } else {
      return this.availableLanguages.indexOf(commonEntries[0]);
    }
  }
}
