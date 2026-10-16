import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  signal,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Constants, KnoraDate } from '@dasch-swiss/dsp-js';
import { CALENDAR_SYSTEMS, CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { DatePickerComponent } from '@dasch-swiss/vre/ui/date-picker';
import { CalendarDateService } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ResourceLabel } from '../../../../constants';

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
    DatePickerComponent,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './string-value.component.html',
  styleUrl: '../../../../statement-builder.scss',
})
export class StringValueComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) valueType!: string;
  @Input() value?: string;
  @Input() showError = false;

  @Output() emitValueChanged = new EventEmitter<string>();

  constants = Constants;
  resourceLabel = ResourceLabel;

  matcher = new ValueErrorStateMatcher();
  inputControl = new FormControl();

  private readonly _calendarDates = inject(CalendarDateService);

  // the date term, held apart from the text input because the picker works on a KnoraDate
  dateControl = new FormControl();

  ngOnInit() {
    this.inputControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this._emitValueChanged(value));

    this.inputControl.setValidators([Validators.required, ...this._getValidators(this.valueType)]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      this._setValue();
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
      const knoraDate = this.value ? this._calendarDates.parseGravsearchDate(this.value as string) : undefined;
      this.dateControl.setValue(knoraDate);
      // A stored term is in its own calendar; telling the picker otherwise relabelled it on the
      // next edit.
      // A cleared term must not leave the old date restricting the calendars on offer.
      this._date.set(knoraDate ?? null);
      if (knoraDate) {
        this.searchCalendar.set(knoraDate.calendar.toUpperCase() as CalendarSystem);
      }
    }
  }

  /**
   * The calendar this search term is expressed in.
   *
   * Held here rather than in the picker: advanced search stores its date as a gravsearch literal,
   * which carries its own calendar, so the calendar is part of the term rather than a display
   * choice. The picker is told this and never changes it.
   */
  readonly searchCalendar = signal<CalendarSystem>('GREGORIAN');

  /** The entered date, as a signal, so the calendars on offer follow it. */
  private readonly _date = signal<KnoraDate | null>(null);

  /** The calendars a switch can go to: those the entered date can be restated in, as in the editor. */
  readonly availableCalendars = computed<readonly CalendarSystem[]>(() => {
    const date = this._date();
    return date ? this._calendarDates.restatableCalendarsFor(date) : CALENDAR_SYSTEMS;
  });

  onDateSelected(date: KnoraDate | null) {
    this.dateControl.setValue(date);
    this._date.set(date);

    // dsp-api parses this literal and compares across calendars server-side, so the term is sent in
    // the calendar the user chose rather than converted here. Formatting it is this component's job:
    // the gravsearch shape is a query format, not something a date picker should know about.
    this.inputControl.setValue(date === null ? null : this._calendarDates.format(date, 'YYYY-MM-dd', 'gravsearch'));
  }

  /**
   * Restates the entered date in the newly chosen calendar, as the editor does — a day converts, a
   * year or month keeps what was entered — then re-emits the term. A calendar that cannot take the
   * date is not switched to, so the selector and the term never disagree.
   */
  onCalendarSelected(calendar: CalendarSystem) {
    // `== null` rather than `=== null`: an untouched FormControl holds undefined, not null, and an
    // empty term has nothing to convert either way.
    const current = this.dateControl.value as KnoraDate | null | undefined;
    if (current == null) {
      this.searchCalendar.set(calendar);
      return;
    }
    const restated = this._calendarDates.restateKnoraDateIn(current, calendar);
    if (restated !== undefined) {
      this.searchCalendar.set(calendar);
      this.onDateSelected(restated);
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
