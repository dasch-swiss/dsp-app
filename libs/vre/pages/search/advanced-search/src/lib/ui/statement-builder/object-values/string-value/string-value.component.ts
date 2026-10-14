import {
  AfterViewInit,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Constants, KnoraDate } from '@dasch-swiss/dsp-js';
import { AppDatePickerComponent } from '@dasch-swiss/vre/ui/date-picker';
import { TranslateModule } from '@ngx-translate/core';
import { asapScheduler, debounceTime, distinctUntilChanged, filter, map, merge, observeOn, Subject } from 'rxjs';
import { ResourceLabel } from '../../../../constants';
import { Operator } from '../../../../operators.config';
import { regexPatternValidator } from './regex-pattern.validator';

class CustomRegex {
  public static readonly INT_REGEX = /^-?\d+$/;
  public static readonly DECIMAL_REGEX = /^[-+]?[0-9]*\.?[0-9]*$/;

  public static readonly URI_REGEX =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,63}(:[0-9]{1,5})?(\/.*)?$/;
}

class ValueErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    if (!control) {
      return false;
    }
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  standalone: true,
  selector: 'app-string-value',
  imports: [
    AppDatePickerComponent,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './string-value.component.html',
  styleUrl: '../../../../advanced-search.component.scss',
})
export class StringValueComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) valueType!: string;
  @Input() value?: string;
  @Input() showError = false;
  /** The statement's operator. With "is like", a label or text value is a regex and must compile. */
  @Input() operator?: Operator;
  /** The statement's property. Picking another one starts the value afresh. */
  @Input() predicateIri?: string;

  @Output() emitValueChanged = new EventEmitter<string>();

  constants = Constants;
  resourceLabel = ResourceLabel;

  matcher = new ValueErrorStateMatcher();
  private _lastEmitted?: string;
  private readonly _revalidated = new Subject<void>();
  inputControl = new FormControl();

  // separate control and FormGroup needed for the date picker
  dateControl = new FormControl();
  dateFormGroup = new FormGroup({ date: this.dateControl });

  ngOnInit() {
    const typed = this.inputControl.valueChanges;
    merge(
      typed.pipe(debounceTime(300)),
      // Withholding an invalid value does not wait for the debounce, so a filter cannot be confirmed with
      // the value from before the edit (DEV-7441). Neither does a re-validation (see ngOnChanges).
      // Both are deferred to a microtask: they can start in ngOnChanges, and the statement must not change
      // while its template is being checked.
      merge(typed.pipe(filter(() => this.inputControl.invalid)), this._revalidated).pipe(observeOn(asapScheduler))
    )
      .pipe(
        map(() => this._valueToEmit()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        this._lastEmitted = value;
        this.emitValueChanged.emit(value);
      });

    this._applyValidators();
  }

  ngOnChanges(changes: SimpleChanges) {
    const predicateChanged = !!changes['predicateIri'] && !changes['predicateIri'].firstChange;
    if (predicateChanged) {
      // Another property drops the statement's value (`StatementElement.selectedPredicate`), so the field
      // starts empty. The `value` input does not always say so: when the old value was invalid, it was
      // already withheld as undefined, and undefined -> undefined is no change (DEV-7441).
      this.inputControl.reset();
      this.dateControl.reset();
    } else if (
      changes['value'] &&
      !changes['value'].firstChange &&
      changes['value'].currentValue !== this._lastEmitted
    ) {
      // An invalid value is emitted as undefined, and the statement hands that back as the new `value`.
      // Applying our own echo would wipe what the user typed, and the error with it (DEV-7441).
      this._setValue();
    }
    // Switching to or from "is like" turns the regex rule on or off for the value already typed; another
    // property may bring another value type.
    if (predicateChanged || (changes['operator'] && !changes['operator'].firstChange)) {
      this._applyValidators();
      this.inputControl.updateValueAndValidity();
      this._revalidated.next();
    }
    if (changes['showError']?.currentValue) {
      this.inputControl.markAsTouched();
    }
  }

  ngAfterViewInit(): void {
    this._setValue();
  }

  private _setValue() {
    if (this.valueType !== Constants.DateValue) {
      this.inputControl.setValue(this.value);
    } else {
      const knoraDate = this.value ? this._transformDateStringToKnoraDateObject(this.value as string) : undefined;
      this.dateControl.setValue(knoraDate);
    }
  }

  onDateSelected(value: string) {
    this.inputControl.setValue(value);
  }

  // we need to provide the date-picker with a KnoraDate but we store the value as a string
  // so we need to convert it back to a KnoraDate
  // the date string format is specific to gravsearch so we can't put this logic in the date-picker itself
  _transformDateStringToKnoraDateObject(dateString: string): KnoraDate {
    let era = '';
    const [calendar, dateAndEra] = dateString.split(':');
    const [datePart, eraPart] = dateAndEra.split(' ');
    const [year, month, day] = datePart.split('-').map(part => parseInt(part));

    era = eraPart || 'CE';

    if (day) {
      return new KnoraDate(calendar, era, year, month, day);
    } else if (month) {
      return new KnoraDate(calendar, era, year, month);
    } else {
      return new KnoraDate(calendar, era, year);
    }
  }

  private _applyValidators(): void {
    // Keyed on the operator alone: whichever value types `operators.config.ts` offers "is like" for, the
    // value reaches dsp-api as a regex (DEV-7441).
    const regex = this.operator === Operator.IsLike ? [regexPatternValidator()] : [];
    this.inputControl.setValidators([Validators.required, ...this._getValidators(this.valueType), ...regex]);
  }

  private _getValidators(objectType: string | undefined): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    switch (objectType) {
      case Constants.DecimalValue:
        validators.push(Validators.pattern(CustomRegex.DECIMAL_REGEX));
        break;

      case Constants.IntValue:
        validators.push(Validators.pattern(CustomRegex.INT_REGEX));
        break;

      case Constants.UriValue:
        validators.push(Validators.pattern(CustomRegex.URI_REGEX));
        break;
    }

    return validators;
  }

  /** The value for the statement: undefined while the field is invalid, keeping the statement incomplete. */
  private _valueToEmit(): string | undefined {
    const value = this.inputControl.value;
    // value could be 0 in the case of a number
    return this.inputControl.valid && value !== null && value !== undefined ? value.toString().trim() : undefined;
  }
}
