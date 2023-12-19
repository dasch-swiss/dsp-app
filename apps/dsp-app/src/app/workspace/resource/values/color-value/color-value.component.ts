import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CreateColorValue, ReadColorValue, UpdateColorValue } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import { CustomRegex } from '../custom-regex';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { ColorPickerComponent } from './color-picker/color-picker.component';

@Component({
  selector: 'app-color-value',
  templateUrl: './color-value.component.html',
  styleUrls: ['./color-value.component.scss'],
})
export class ColorValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
  @ViewChild('colorInput') colorPickerComponent: ColorPickerComponent;

  @Input() displayValue?: ReadColorValue;

  @Input() showHexCode = false;

  customValidators = [Validators.pattern(CustomRegex.COLOR_REGEX)];
  matcher = new ValueErrorStateMatcher();
  textColor: string;

  constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
    super();
  }

  getInitValue(): string | null {
    if (this.displayValue !== undefined) {
      return this.displayValue.color;
    } else {
      return null;
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.textColor = this.getTextColor(this.valueFormControl.value);
  }

  ngOnChanges(): void {
    this.resetFormControl();

    if (this.showHexCode && this.valueFormControl !== undefined) {
      this.textColor = this.getTextColor(this.valueFormControl.value);
    }
  }

  // unsubscribe when the object is destroyed to prevent memory leaks
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getNewValue(): CreateColorValue | false {
    if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
      return false;
    }

    const newColorValue = new CreateColorValue();

    newColorValue.color = this.valueFormControl.value;

    if (this.commentFormControl.value) {
      newColorValue.valueHasComment = this.commentFormControl.value;
    }

    return newColorValue;
  }

  getUpdatedValue(): UpdateColorValue | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }

    const updatedColorValue = new UpdateColorValue();

    updatedColorValue.id = this.displayValue.id;

    updatedColorValue.color = this.valueFormControl.value;

    // add the submitted comment to updatedIntValue only if user has added a comment
    if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
      updatedColorValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedColorValue;
  }

  // calculate text color
  getTextColor(hex: string): string {
    if (!hex) {
      return;
    }

    // convert hexadicemal color value into rgb color value
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const rgb: { r: number; g: number; b: number } = result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;

    // calculate luminance
    const a = [rgb.r, rgb.g, rgb.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const luminance = a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;

    return luminance > 0.179 ? '#000000' : '#ffffff';
  }
}
