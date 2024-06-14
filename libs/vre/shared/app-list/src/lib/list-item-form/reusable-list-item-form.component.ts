import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { ListItemForm } from './list-item-form.type';

@Component({
  selector: 'app-reusable-list-item-form',
  template: `
    <dasch-swiss-multi-language-input
      placeholder="Child node label *"
      [formArray]="form.controls.labels"
      [validators]="labelsValidators">
    </dasch-swiss-multi-language-input>

    <dasch-swiss-multi-language-textarea
      placeholder="Child node description"
      [formArray]="form.controls.comments"
      [validators]="commentsValidators">
    </dasch-swiss-multi-language-textarea>
  `,
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

  constructor(private _fb: FormBuilder) {}

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
