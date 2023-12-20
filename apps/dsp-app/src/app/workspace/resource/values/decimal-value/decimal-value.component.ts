import { Component, Inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CreateDecimalValue, ReadDecimalValue, UpdateDecimalValue } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '../../../../main/directive/base-value.directive';
import { CustomRegex } from '../custom-regex';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';

@Component({
  selector: 'app-decimal-value',
  templateUrl: './decimal-value.component.html',
  styleUrls: ['./decimal-value.component.scss'],
})
export class DecimalValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
  @Input() displayValue?: ReadDecimalValue;

  matcher = new ValueErrorStateMatcher();

  customValidators = [Validators.pattern(CustomRegex.DECIMAL_REGEX)]; // only allow for decimal values

  constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
    super();
  }

  getInitValue(): number | null {
    if (this.displayValue !== undefined) {
      return this.displayValue.decimal;
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

  getNewValue(): CreateDecimalValue | false {
    if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
      return false;
    }

    const newDecimalValue = new CreateDecimalValue();

    newDecimalValue.decimal = this.valueFormControl.value;

    if (this.commentFormControl.value) {
      newDecimalValue.valueHasComment = this.commentFormControl.value;
    }

    return newDecimalValue;
  }

  getUpdatedValue(): UpdateDecimalValue | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }

    const updatedDecimalValue = new UpdateDecimalValue();

    updatedDecimalValue.id = this.displayValue.id;

    updatedDecimalValue.decimal = this.valueFormControl.value;

    // add the submitted comment to updatedIntValue only if user has added a comment
    if (this.commentFormControl.value) {
      updatedDecimalValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedDecimalValue;
  }
}
