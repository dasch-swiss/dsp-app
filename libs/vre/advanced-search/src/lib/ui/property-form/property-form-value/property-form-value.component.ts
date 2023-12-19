import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Constants, KnoraDate } from '@dasch-swiss/dsp-js';
import { AppDatePickerComponent } from '@dasch-swiss/vre/shared/app-date-picker';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResourceLabel } from '../../../data-access/advanced-search-service/advanced-search.service';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';
@Component({
  selector: 'dasch-swiss-property-form-value',
  standalone: true,
  imports: [
    AppDatePickerComponent,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './property-form-value.component.html',
  styleUrls: ['./property-form-value.component.scss'],
})
export class PropertyFormValueComponent implements OnInit, AfterViewInit {
  @Input() objectType: string | undefined = '';
  @Input() value: string | PropertyFormItem[] | undefined = '';

  @Output() emitValueChanged = new EventEmitter<string>();

  constants = Constants;
  resourceLabel = ResourceLabel;

  matcher = new ValueErrorStateMatcher();
  inputControl = new FormControl();

  // separate control and FormGroup needed for the date picker
  dateControl = new FormControl();
  dateFormGroup = new FormGroup({ date: this.dateControl });

  ngOnInit() {
    this.inputControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => this._emitValueChanged(value));

    this.inputControl.setValidators(this._getValidators(this.objectType));
  }

  ngAfterViewInit(): void {
    if (!this.value || typeof this.value !== 'string') return;
    if (this.objectType !== Constants.DateValue) {
      this.inputControl.setValue(this.value);
    } else {
      const knoraDate = this._transformDateStringToKnoraDateObject(
        this.value as string
      );
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

    era = eraPart ? eraPart : 'CE';

    if (day) {
      return new KnoraDate(calendar, era, year, month, day);
    } else if (month) {
      return new KnoraDate(calendar, era, year, month);
    } else {
      return new KnoraDate(calendar, era, year);
    }
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

  private _emitValueChanged(value: string) {
    // value could be 0 in the case of a number
    if (this.inputControl.valid && value !== null && value !== undefined)
      this.emitValueChanged.emit(value.toString().trim());
    else this.emitValueChanged.emit(undefined);
  }
}

class ValueErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    if (!control) {
      return false;
    }
    return control && control.invalid && (control.dirty || control.touched);
  }
}

class CustomRegex {
  public static readonly INT_REGEX = /^-?\d+$/;

  public static readonly DECIMAL_REGEX = /^[-+]?[0-9]*\.?[0-9]*$/;

  public static readonly URI_REGEX =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,63}(:[0-9]{1,5})?(\/.*)?$/;
}
