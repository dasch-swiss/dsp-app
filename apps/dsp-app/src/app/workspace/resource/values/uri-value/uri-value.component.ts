import { Component, Inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CreateUriValue, ReadUriValue, UpdateUriValue } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import { CustomRegex } from '../custom-regex';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';

@Component({
  selector: 'app-uri-value',
  templateUrl: './uri-value.component.html',
  styleUrls: ['./uri-value.component.scss'],
})
export class UriValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
  @Input() displayValue?: ReadUriValue;
  @Input() label?: string;

  matcher = new ValueErrorStateMatcher();

  customValidators = [Validators.pattern(CustomRegex.URI_REGEX)];

  constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
    super();
  }

  getInitValue(): string | null {
    if (this.displayValue !== undefined) {
      return this.displayValue.uri;
    } else {
      return null;
    }
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnChanges(): void {
    this.resetFormControl();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getNewValue(): CreateUriValue | false {
    if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
      return false;
    }

    const newUriValue = new CreateUriValue();

    newUriValue.uri = this.valueFormControl.value;

    if (this.commentFormControl.value) {
      newUriValue.valueHasComment = this.commentFormControl.value;
    }

    return newUriValue;
  }

  getUpdatedValue(): UpdateUriValue | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }
    const updatedUriValue = new UpdateUriValue();

    updatedUriValue.id = this.displayValue.id;

    updatedUriValue.uri = this.valueFormControl.value;

    if (this.commentFormControl.value) {
      updatedUriValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedUriValue;
  }
}
