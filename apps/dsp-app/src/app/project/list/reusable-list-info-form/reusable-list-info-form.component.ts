import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { atLeastOneStringRequired } from '../../reusable-project-form/at-least-one-string-required.validator';

@Component({
  selector: 'app-reusable-list-info-form',
  template: `
    <dasch-swiss-multi-language-input
      placeholder="Controlled vocabulary label *"
      [formGroup]="form"
      controlName="labels">
    </dasch-swiss-multi-language-input>

    <dasch-swiss-multi-language-textarea
      placeholder="Controlled vocabulary description *"
      [formGroup]="form"
      controlName="comments">
    </dasch-swiss-multi-language-textarea>
  `,
})
export class ReusableListInfoFormComponent implements OnInit, OnDestroy {
  @Input() formData: {
    labels: StringLiteral[];
    comments: StringLiteral[];
  };

  @Output() formValueChange = new EventEmitter<FormGroup>();

  form: FormGroup;
  subscription: Subscription;

  constructor(private _fb: FormBuilder) {}

  ngOnInit() {
    console.log('before', this);
    this._buildForm();
    console.log(this);

    this.subscription = this.form.valueChanges.pipe(startWith(null)).subscribe(z => {
      this.formValueChange.emit(this.form);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  _buildForm() {
    this.form = this._fb.group({
      labels: this._fb.array(
        this.formData.labels.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, [Validators.maxLength(2000)]],
          })
        ),
        atLeastOneStringRequired('value')
      ),
      comments: this._fb.array(
        this.formData.comments.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, [Validators.maxLength(2000)]],
          })
        ),
        atLeastOneStringRequired('value')
      ),
    });
  }
}
