import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { Store } from '@ngxs/store';
import { arrayLengthGreaterThanZeroValidator } from '../../main/form-validators/array-length-greater-than-zero-validator';
import { atLeastOneStringRequired } from '../../main/form-validators/at-least-one-string-required.validator';
import { ProjectForm } from './project-form.type';
import { shortcodeExistsValidator } from './shortcode-exists.validator';

@Component({
  selector: 'app-reusable-project-form',
  template: `
    <form *ngIf="form" [formGroup]="form">
      <div style="display: flex">
        <app-common-input
          [control]="form.controls.shortcode"
          [placeholder]="'appLabels.form.project.general.shortcode' | translate"
          [validatorErrors]="[shortcodePatternError, shortCodeExistsError]"
          data-cy="shortcode-input"
          style="flex: 1; margin-right: 16px"></app-common-input>

        <app-common-input
          [control]="form.controls.shortname"
          [placeholder]="'appLabels.form.project.general.shortname' | translate"
          data-cy="shortname-input"
          style="flex: 1"></app-common-input>
      </div>

      <app-common-input
        [placeholder]="'appLabels.form.project.general.longname' | translate"
        [control]="form.controls.longname"
        data-cy="longname-input"></app-common-input>

      <dasch-swiss-multi-language-textarea
        [placeholder]="('appLabels.form.project.general.description' | translate) + '*'"
        [formArray]="form.controls.description"
        [validators]="descriptionValidators"
        data-cy="description-input">
      </dasch-swiss-multi-language-textarea>

      <app-chip-list-input
        [formGroup]="form"
        controlName="keywords"
        data-cy="keywords-input"
        [validators]="keywordsValidators">
      </app-chip-list-input>
    </form>
  `,
})
export class ReusableProjectFormComponent implements OnInit {
  @Input() formData: {
    shortcode: string;
    shortname: string;
    longname: string;
    description: MultiLanguages;
    keywords: string[];
  };
  @Output() afterFormInit = new EventEmitter<ProjectForm>();

  form: ProjectForm;
  readonly shortcodePatternError = {
    errorKey: 'pattern',
    message: 'This field must contains letters from A to F and 0 to 9',
  };
  readonly shortCodeExistsError = { errorKey: 'shortcodeExists', message: 'This shortcode already exists' };
  readonly keywordsValidators = [Validators.minLength(3), Validators.maxLength(64)];
  readonly descriptionValidators = [Validators.minLength(3), Validators.maxLength(40960)];

  constructor(
    private _fb: FormBuilder,
    private _store: Store
  ) {}

  ngOnInit() {
    this._buildForm();
    this.afterFormInit.emit(this.form);
  }

  private _buildForm() {
    const existingShortcodes = this._store.selectSnapshot(ProjectsSelectors.allProjectShortcodes);

    this.form = this._fb.group({
      shortcode: [
        { value: this.formData.shortcode, disabled: this.formData.shortcode !== '' },
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(4),
          Validators.pattern(/^[0-9A-Fa-f]+$/),
          shortcodeExistsValidator(existingShortcodes),
        ],
      ],
      shortname: [
        { value: this.formData.shortname, disabled: this.formData.shortname !== '' },
        [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z]+\S*$/)],
      ],
      longname: [this.formData.longname, [Validators.required, Validators.minLength(3), Validators.maxLength(256)]],
      description: DEFAULT_MULTILANGUAGE_FORM(this.formData.description, this.descriptionValidators, [
        atLeastOneStringRequired('value'),
      ]),
      keywords: this._fb.array(
        this.formData.keywords.map(keyword => {
          return [keyword, this.keywordsValidators];
        }),
        arrayLengthGreaterThanZeroValidator()
      ),
    });
  }
}
