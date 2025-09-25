import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  Optional,
  Self,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';

/** error when invalid control is dirty, touched, or submitted. */
export class ColorPickerErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: ColorPickerComponent }, { provide: Subject }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ColorPickerComponent implements ControlValueAccessor, MatFormFieldControl<string>, DoCheck, OnDestroy {
  static nextId = 0;

  @Input() errorStateMatcher: ErrorStateMatcher = new ColorPickerErrorStateMatcher();

  // Required for MatFormFieldControl
  stateChanges = new Subject<void>();

  @HostBinding() id = `app-color-picker-${ColorPickerComponent.nextId++}`;

  @HostBinding('attr.aria-describedby') describedBy = '';
  colorForm: UntypedFormGroup;
  focused = false;
  errorState = false;
  controlType = 'app-color-picker';
  matcher = new ColorPickerErrorStateMatcher();

  private _required = false;
  private _disabled = false;
  private _placeholder = '';

  @Input()
  get placeholder() {
    return this._placeholder;
  }

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get required() {
    return this._required;
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  @Input()
  get value(): string | null {
    const colorValue = this.colorForm.value;
    if (colorValue !== null) {
      return colorValue.color;
    }
    return null;
  }

  get empty() {
    const colorInput = this.colorForm.value;
    return !colorInput.color;
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._disabled ? this.colorForm.disable() : this.colorForm.enable();
    this.stateChanges.next();
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set value(colorValue: string | null) {
    if (colorValue !== null) {
      this.colorForm.setValue({ color: colorValue });
    } else {
      this.colorForm.setValue({ color: null });
    }
    this.stateChanges.next();
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(
    fb: UntypedFormBuilder,
    @Optional() @Self() public ngControl: NgControl,
    private _elRef: ElementRef<HTMLElement>
  ) {
    this.colorForm = fb.group({
      color: [null, Validators.required],
    });

    // Monitor focus state
    this.focused = false;

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.placeholder = 'Click to select a color';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  onChange = (_: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  ngDoCheck() {
    if (this.ngControl) {
      // Update error state manually since we don't have the mixin
      this.errorState = this.ngControl ? !!this.ngControl.invalid && !!this.ngControl.touched : false;
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      const input = this._elRef.nativeElement.querySelector('input');
      if (input) {
        input.focus();
      }
    }
  }

  writeValue(colorValue: string | null): void {
    this.value = colorValue;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  _handleInput() {
    this.onChange(this.value);
  }
}
