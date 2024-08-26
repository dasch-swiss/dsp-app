import { Directive, ElementRef, forwardRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { secondsToTimeString } from './seconds-to-time-string';
import { timeStringToSeconds } from './time-string-to-seconds';

@Directive({
  selector: '[appTimeFormat]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeFormatDirective),
      multi: true,
    },
  ],
})
export class TimeFormatDirective implements ControlValueAccessor {
  private onChange: (value: number) => void;
  private onTouched: () => void;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    if (this.onChange) {
      this.onChange(timeStringToSeconds(value));
    }
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.onTouched) {
      this.onTouched();
    }
  }

  writeValue(value: number): void {
    const formattedValue = secondsToTimeString(value);
    this.el.nativeElement.value = formattedValue;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }
}
