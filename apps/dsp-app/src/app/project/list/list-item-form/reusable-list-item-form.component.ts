import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MultiLanguageFormArray, MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { atLeastOneStringRequired } from '../../../main/form-validators/at-least-one-string-required.validator';

@Component({
  selector: 'app-reusable-list-item-form',
  template: `
    <dasch-swiss-multi-language-input
      placeholder="Child node label *"
      [formArray]="labelsControl"
      [validators]="labelsValidators">
    </dasch-swiss-multi-language-input>

    <dasch-swiss-multi-language-textarea
      placeholder="Child node description"
      [formArray]="commentsControl"
      [validators]="commentsValidators">
    </dasch-swiss-multi-language-textarea>
  `,
})
export class ReusableListItemFormComponent implements OnInit, OnDestroy {
  @Input() formData: {
    labels: MultiLanguages;
    comments: MultiLanguages;
  };

  @Output() formValueChange = new EventEmitter<FormGroup>();

  form: FormGroup;
  subscription: Subscription;

  readonly labelsValidators = [Validators.required, Validators.maxLength(2000)];
  readonly commentsValidators = [Validators.required, Validators.maxLength(2000)];

  // TODO remove with typed forms
  get labelsControl() {
    return this.form.get('labels') as MultiLanguageFormArray;
  }

  // TODO remove with typed forms
  get commentsControl() {
    return this.form.get('comments') as MultiLanguageFormArray;
  }

  constructor(private _fb: FormBuilder) {}

  ngOnInit() {
    this._buildForm();

    this.subscription = this.form.valueChanges.pipe(startWith(<FormGroup>null)).subscribe(z => {
      this.formValueChange.emit(this.form);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private _buildForm() {
    this.form = this._fb.group({
      labels: this._fb.array(
        this.formData.labels.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, this.labelsValidators],
          })
        ),
        atLeastOneStringRequired('value')
      ),
      comments: this._fb.array(
        this.formData.comments.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, this.commentsValidators],
          })
        )
      ),
    });
  }
}
