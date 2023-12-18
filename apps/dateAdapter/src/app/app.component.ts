import {
  Component,
  Directive,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';

import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {
  MatCalendar,
  MatDatepickerContent,
} from '@angular/material/datepicker';
import {
  CalendarDate,
  CalendarPeriod,
  GregorianCalendarDate,
  IslamicCalendarDate,
  JDNConvertibleCalendar,
  JulianCalendarDate,
} from '@dasch-swiss/jdnconvertiblecalendar';
import {
  ACTIVE_CALENDAR,
  JDNConvertibleCalendarDateAdapter,
} from '@dasch-swiss/jdnconvertiblecalendardateadapter';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  form: UntypedFormGroup;
  form2: UntypedFormGroup;
  form3: UntypedFormGroup;
  form4: UntypedFormGroup;

  headerComponent = HeaderComponent;

  // October 13 1729 (Julian calendar)
  startCalDate = new CalendarDate(1729, 10, 13);
  startDate = new JulianCalendarDate(
    new CalendarPeriod(this.startCalDate, this.startCalDate)
  );

  // October 24 1729 (Julian calendar)
  startCalDate2 = new CalendarDate(1729, 10, 24);
  startDate2 = new GregorianCalendarDate(
    new CalendarPeriod(this.startCalDate2, this.startCalDate2)
  );

  // October 24 1729 (Islamic calendar)
  startCalDate3 = new CalendarDate(1142, 4, 1);
  startDate3 = new IslamicCalendarDate(
    new CalendarPeriod(this.startCalDate3, this.startCalDate3)
  );

  constructor(@Inject(UntypedFormBuilder) private fb: UntypedFormBuilder) {
    this.form = this.fb.group({
      dateValue: [this.startDate, Validators.compose([Validators.required])],
    });

    this.form.valueChanges.subscribe((data) => {
      console.log(data.dateValue);
    });

    this.form2 = this.fb.group({
      dateValue2: [this.startDate2, Validators.compose([Validators.required])],
    });

    this.form2.valueChanges.subscribe((data) => {
      console.log(data.dateValue2);
    });

    this.form3 = this.fb.group({
      dateValue3: [this.startDate3, Validators.compose([Validators.required])],
    });

    this.form3.valueChanges.subscribe((data) => {
      console.log(data.dateValue3);
    });

    this.form4 = this.fb.group({
      dateValue4: [null, Validators.compose([Validators.required])],
    });

    this.form4.valueChanges.subscribe((data) => {
      console.log(data.dateValue4);
    });
  }
}

@Component({
  selector: 'app-calendar-header',
  template: `
    <mat-select placeholder="Calendar" [formControl]="calendar">
      <mat-option *ngFor="let cal of supportedCalendars" [value]="cal">{{
        cal
      }}</mat-option>
    </mat-select>
    <mat-calendar-header></mat-calendar-header>
  `,
  styleUrls: [],
})
export class HeaderComponent implements OnInit {
  constructor(
    private _calendar: MatCalendar<JDNConvertibleCalendar>,
    private _dateAdapter: DateAdapter<JDNConvertibleCalendar>,
    private _datepickerContent: MatDatepickerContent<JDNConvertibleCalendar>,
    @Inject(UntypedFormBuilder) private fb: UntypedFormBuilder
  ) {}

  form: UntypedFormGroup;
  calendar: UntypedFormControl;

  supportedCalendars = JDNConvertibleCalendar.supportedCalendars;

  ngOnInit() {
    if (this._dateAdapter instanceof JDNConvertibleCalendarDateAdapter) {
      this.calendar = new UntypedFormControl(
        this._dateAdapter.activeCalendar,
        Validators.required
      );

      // build a form for the calendar selection
      this.form = this.fb.group({
        calendar: this.calendar,
      });

      // update the selected calendar
      this.form.valueChanges.subscribe((data) => {
        this.convertCalendar(data.calendar);
      });
    }
  }

  /**
   * Converts the date in the current calender into the target calendar.
   *
   * @param {"Gregorian" | "Julian"} calendar the target calendar.
   */
  convertCalendar(calendar: 'Gregorian' | 'Julian' | 'Islamic') {
    if (this._dateAdapter instanceof JDNConvertibleCalendarDateAdapter) {
      const convertedDate = this._dateAdapter.convertCalendar(
        this._calendar.activeDate,
        calendar
      );

      this._calendar.activeDate = convertedDate;

      this._datepickerContent.datepicker.select(convertedDate);

      this._calendar.updateTodaysDate();
    }
  }
}

const makeCalToken = () => {
  return new BehaviorSubject('Gregorian');
};

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'jdn-datepicker',
  providers: [
    { provide: ACTIVE_CALENDAR, useFactory: makeCalToken },
    {
      provide: DateAdapter,
      useClass: JDNConvertibleCalendarDateAdapter,
      deps: [MAT_DATE_LOCALE, ACTIVE_CALENDAR],
    },
  ],
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class JdnDatepicker implements OnChanges, OnDestroy {
  @Input() activeCalendar: 'Gregorian' | 'Julian' | 'Islamic';

  constructor(
    private adapter: DateAdapter<JDNConvertibleCalendar>,
    @Inject(ACTIVE_CALENDAR)
    private activeCalendarToken: BehaviorSubject<
      'Gregorian' | 'Julian' | 'Islamic'
    >
  ) {}

  ngOnChanges(): void {
    this.activeCalendarToken.next(this.activeCalendar);
  }

  ngOnDestroy(): void {
    this.activeCalendarToken.complete();
  }
}
