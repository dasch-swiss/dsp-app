import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { map } from 'rxjs';
import { ProjectForm } from './project-form.type';
import { shortcodeExistsValidator } from './shortcode-exists.validator';

@Component({
  selector: 'app-reusable-project-form',
  template: `
    <form *ngIf="form" [formGroup]="form">
      <div style="display: flex">
        <app-common-input
          [control]="form.controls.shortcode"
          [label]="'pages.project.reusableProjectForm.shortcode' | translate"
          [validatorErrors]="[shortcodePatternError, shortCodeExistsError]"
          data-cy="shortcode-input"
          style="flex: 1; margin-right: 16px" />

        <app-common-input
          [control]="form.controls.shortname"
          [label]="'pages.project.reusableProjectForm.shortname' | translate"
          data-cy="shortname-input"
          style="flex: 1" />
      </div>

      <app-common-input
        [label]="'pages.project.reusableProjectForm.longname' | translate"
        [control]="form.controls.longname"
        data-cy="longname-input" />

      <app-multi-language-textarea
        [placeholder]="'pages.project.reusableProjectForm.description' | translate"
        [formArray]="form.controls.description"
        [validators]="descriptionValidators"
        [isRequired]="true"
        data-cy="description-input" />

      <app-chip-list-input
        [formArray]="form.controls.keywords"
        data-cy="keywords-input"
        [validators]="keywordsValidators" />
    </form>
  `,
})
export class ReusableProjectFormComponent implements OnInit {
  @Input({ required: true }) formData!: {
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
    message: 'This field must contain letters from A to F and 0 to 9',
  };
  readonly shortCodeExistsError = { errorKey: 'shortcodeExists', message: 'This shortcode already exists' };
  readonly keywordsValidators = [Validators.minLength(3), Validators.maxLength(64)];
  readonly descriptionValidators = [Validators.minLength(3), Validators.maxLength(40960)];

  constructor(
    private _fb: FormBuilder,
    private _allProjectsService: AllProjectsService
  ) {}

  ngOnInit() {
    this._allProjectsService.allProjects$
      .pipe(map(projects => projects.map(project => project.shortcode)))
      .subscribe(shortcodes => {
        this._buildForm(shortcodes);
        this.afterFormInit.emit(this.form);
      });
  }

  public noWhitespaceValidator(control: FormControl) {
    return (control.value || '').trim().length ? null : { errorKey: 'whitespace', message: 'no whitespace' };
  }

  private _buildForm(shortcodes: string[]) {
    this.form = this._fb.group({
      shortcode: [
        { value: this.formData.shortcode, disabled: this.formData.shortcode !== '' },
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(4),
          Validators.pattern(/^[0-9A-Fa-f]+$/),
          shortcodeExistsValidator(shortcodes),
        ],
      ],
      shortname: [
        { value: this.formData.shortname, disabled: this.formData.shortname !== '' },
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          this.noWhitespaceValidator,
          Validators.pattern(/^[a-zA-Z]+\S*$/),
        ],
      ],
      longname: [this.formData.longname, [Validators.required, Validators.minLength(3), Validators.maxLength(256)]],
      description: DEFAULT_MULTILANGUAGE_FORM(this.formData.description, this.descriptionValidators, [
        atLeastOneStringRequired('value'),
      ]),
      keywords: this._fb.array(
        this.formData.keywords.map(keyword => {
          return [keyword, this.keywordsValidators];
        }),
        Validators.required
      ),
    });
  }
}
