import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ensureWithDefaultLanguage } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { existingNamesAsyncValidator } from '@dasch-swiss/vre/pages/user-settings/user';
import { atLeastOneStringRequired, CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  MultiLanguageInputComponent,
  MultiLanguageTextareaComponent,
  DEFAULT_MULTILANGUAGE_FORM,
} from '@dasch-swiss/vre/ui/string-literal';
import { CommonInputComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { ResourceClassForm, ResourceClassFormData } from './resource-class-form.type';

@Component({
  selector: 'app-resource-class-form',
  template: `
    <form [formGroup]="form">
      <app-common-input
        class="name-input"
        data-cy="name-input"
        [control]="form.controls.name"
        [label]="'pages.ontology.resourceClassForm.name' | translate"
        [validatorErrors]="[{ errorKey: 'pattern', message: 'pages.ontology.resourceClassForm.patternError' }]"
        prefixIcon="fingerprint" />

      <app-multi-language-input
        data-cy="label-input"
        [placeholder]="'pages.ontology.resourceClassForm.labelPlaceholder' | translate"
        [formArray]="form.controls.labels"
        [validators]="labelsValidators"
        [isRequired]="true" />

      <app-multi-language-textarea
        data-cy="comment-textarea"
        [placeholder]="'pages.ontology.resourceClassForm.commentPlaceholder' | translate"
        [formArray]="form.controls.comments"
        [editable]="true"
        [validators]="commentsValidators"
        [isRequired]="true" />
    </form>
  `,
  styles: [':host ::ng-deep .name-input .mat-icon { padding-right: 24px; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonInputComponent,
    MultiLanguageInputComponent,
    MultiLanguageTextareaComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class ResourceClassFormComponent implements OnInit {
  @Input({ required: true }) formData!: ResourceClassFormData;
  @Output() afterFormInit = new EventEmitter<ResourceClassForm>();

  form!: ResourceClassForm;

  readonly labelsValidators = [Validators.maxLength(2000)];
  readonly commentsValidators = [Validators.maxLength(2000)];

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _oes: OntologyEditService,
    private readonly _localizationService: LocalizationService
  ) {}

  ngOnInit() {
    this.form = this._fb.group({
      name: this._fb.control(this.formData.name, {
        validators: [Validators.required, Validators.pattern(CustomRegex.ID_NAME_REGEX)],
        asyncValidators: [existingNamesAsyncValidator(this._oes.currentOntologyEntityNames$, true)],
        nonNullable: true,
      }),
      labels: DEFAULT_MULTILANGUAGE_FORM(
        ensureWithDefaultLanguage(this.formData.labels, this._localizationService.getCurrentLanguage()),
        this.labelsValidators,
        [atLeastOneStringRequired('value')]
      ),
      comments: DEFAULT_MULTILANGUAGE_FORM(
        ensureWithDefaultLanguage(this.formData.comments, this._localizationService.getCurrentLanguage()),
        this.commentsValidators,
        [atLeastOneStringRequired('value')]
      ),
    });

    this.afterFormInit.emit(this.form);
  }
}
