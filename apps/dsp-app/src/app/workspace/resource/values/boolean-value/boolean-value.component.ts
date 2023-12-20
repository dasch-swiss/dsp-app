import { Component, Inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CreateBooleanValue, ReadBooleanValue, UpdateBooleanValue } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '../../../../main/directive/base-value.directive';

@Component({
  selector: 'app-boolean-value',
  templateUrl: './boolean-value.component.html',
  styleUrls: ['./boolean-value.component.scss'],
})
export class BooleanValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
  @Input() displayValue?: ReadBooleanValue;

  @Input() moreSpace?: boolean;

  // whether a completely new resource is defined or not
  @Input() newResource = false;

  customValidators = [];

  boolValIsUnset = false; // Whether there is no boolVal set at all

  constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
    super();
  }

  // return false as default value if there is no this.displayValue
  getInitValue(): boolean {
    return this.displayValue ? this.displayValue.bool : false;
  }

  ngOnInit() {
    // set the boolean value to unset if the new property is not required
    this.boolValIsUnset = this.mode === 'create' && !this.valueRequiredValidator;
    super.ngOnInit();
  }

  ngOnChanges(): void {
    this.resetFormControl();
  }

  // unsubscribe when the object is destroyed to prevent memory leaks
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getNewValue(): CreateBooleanValue | false {
    if (this.mode !== 'create' || !this.form.valid || this.boolValIsUnset) {
      // don't provide a new value, leave boolean value unset
      return false;
    }

    const newBooleanValue = new CreateBooleanValue();

    newBooleanValue.bool = this.valueFormControl.value;

    // add the submitted new comment to newBooleanValue only if the user has added a comment
    if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
      newBooleanValue.valueHasComment = this.commentFormControl.value;
    }

    return newBooleanValue;
  }

  getUpdatedValue(): UpdateBooleanValue | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }

    const updatedBooleanValue = new UpdateBooleanValue();

    updatedBooleanValue.id = this.displayValue.id;

    updatedBooleanValue.bool = this.valueFormControl.value;

    // add the submitted comment to updatedBooleanValue only if user has added a comment
    if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
      updatedBooleanValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedBooleanValue;
  }
}
