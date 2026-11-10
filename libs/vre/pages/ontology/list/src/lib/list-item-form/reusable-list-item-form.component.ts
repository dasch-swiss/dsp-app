import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import {
  DEFAULT_MULTILANGUAGE_FORM,
  MultiLanguageFieldsComponent,
  MultiLanguageInputComponent,
  MultiLanguageLayout,
  MultiLanguageTextareaComponent,
  MultiLanguages,
} from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { ListItemForm } from './list-item-form.type';

@Component({
  selector: 'app-reusable-list-item-form',
  template: `
    @if (layout === 'stacked') {
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
    } @else {
      <app-multi-language-input
        [placeholder]="'pages.ontology.list.reusableForm.labelPlaceholder' | translate"
        [formArray]="form.controls.labels"
        [validators]="labelsValidators"
        [isRequired]="true" />
      <app-multi-language-textarea
        [placeholder]="'pages.ontology.list.reusableForm.commentPlaceholder' | translate"
        [formArray]="form.controls.comments"
        [validators]="commentsValidators"
        [isRequired]="false" />
    }
  `,
  imports: [TranslatePipe, MultiLanguageFieldsComponent, MultiLanguageInputComponent, MultiLanguageTextareaComponent],
})
export class ReusableListItemFormComponent implements OnInit {
  @Input() formData: {
    labels: MultiLanguages;
    comments: MultiLanguages;
  };
  /**
   * How the label and description show their languages: one field with a language switcher each, or every language in
   * its own field, as Data models 2 shows them.
   */
  @Input() layout: MultiLanguageLayout = 'switcher';
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
