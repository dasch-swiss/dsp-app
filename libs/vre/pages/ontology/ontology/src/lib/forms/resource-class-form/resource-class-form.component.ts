import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { existingNamesAsyncValidator } from '@dasch-swiss/vre/pages/user-settings/user';
import { atLeastOneStringRequired, CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/ui/string-literal';
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
        label="Class name"
        [validatorErrors]="[{ errorKey: 'pattern', message: 'This pattern is not supported' }]"
        prefixIcon="fingerprint" />

      <app-multi-language-input
        data-cy="label-input"
        placeholder="Label"
        [formArray]="form.controls.labels"
        [validators]="labelsValidators"
        [isRequired]="true" />

      <app-multi-language-textarea
        data-cy="comment-textarea"
        placeholder="Comment"
        [formArray]="form.controls.comments"
        [editable]="true"
        [validators]="commentsValidators"
        [isRequired]="true" />
    </form>
  `,
  styles: [':host ::ng-deep .name-input .mat-icon { padding-right: 24px; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassFormComponent implements OnInit {
  @Input({ required: true }) formData!: ResourceClassFormData;
  @Output() afterFormInit = new EventEmitter<ResourceClassForm>();

  form!: ResourceClassForm;

  readonly labelsValidators = [Validators.maxLength(2000)];
  readonly commentsValidators = [Validators.maxLength(2000)];

  constructor(
    private _fb: FormBuilder,
    private _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this.form = this._fb.group({
      name: this._fb.control(this.formData.name, {
        validators: [Validators.required, Validators.pattern(CustomRegex.ID_NAME_REGEX)],
        asyncValidators: [existingNamesAsyncValidator(this._oes.currentOntologyEntityNames$, true)],
        nonNullable: true,
      }),
      labels: DEFAULT_MULTILANGUAGE_FORM(this.formData.labels, this.labelsValidators, [
        atLeastOneStringRequired('value'),
      ]),
      comments: DEFAULT_MULTILANGUAGE_FORM(this.formData.comments, this.commentsValidators, [
        atLeastOneStringRequired('value'),
      ]),
    });

    this.afterFormInit.emit(this.form);
  }
}
