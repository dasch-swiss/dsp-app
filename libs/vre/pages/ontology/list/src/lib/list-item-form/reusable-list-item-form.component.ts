import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import {
  DEFAULT_MULTILANGUAGE_FORM,
  MultiLanguageFieldsComponent,
  MultiLanguageModeSwitchComponent,
  MultiLanguages,
} from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { ListItemForm } from './list-item-form.type';

@Component({
  selector: 'app-reusable-list-item-form',
  template: `
    <app-multi-language-mode-switch />
    <app-multi-language-fields
      data-cy="label-input"
      [label]="'pages.ontology.list.reusableForm.labelPlaceholder' | translate"
      [formArray]="form.controls.labels"
      [validators]="labelsValidators"
      [isRequired]="true" />
    <app-multi-language-fields
      data-cy="comment-textarea"
      [label]="'pages.ontology.list.reusableForm.commentPlaceholder' | translate"
      [formArray]="form.controls.comments"
      [validators]="commentsValidators"
      [multiline]="true" />
  `,
  imports: [TranslatePipe, MultiLanguageFieldsComponent, MultiLanguageModeSwitchComponent],
})
export class ReusableListItemFormComponent implements OnInit {
  @Input() formData: {
    labels: MultiLanguages;
    comments: MultiLanguages;
  };
  @Output() afterFormInit = new EventEmitter<ListItemForm>();

  form: ListItemForm;

  readonly labelsValidators = [Validators.required, Validators.maxLength(2000)];
  readonly commentsValidators = [Validators.required, Validators.maxLength(2000)];

  constructor(private readonly _fb: FormBuilder) {}

  ngOnInit() {
    this.form = this._fb.group({
      labels: DEFAULT_MULTILANGUAGE_FORM(this.formData.labels, this.labelsValidators, [
        atLeastOneStringRequired('value'),
      ]),
      comments: DEFAULT_MULTILANGUAGE_FORM(this.formData.comments, this.commentsValidators),
    });

    this.afterFormInit.emit(this.form);
  }
}
