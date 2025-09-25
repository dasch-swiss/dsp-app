import { Directive, Inject, Input, OnChanges, OnDestroy } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ACTIVE_CALENDAR, JDNConvertibleCalendarDateAdapter } from '@dasch-swiss/jdnconvertiblecalendardateadapter';
import { BehaviorSubject } from 'rxjs';

export function makeCalendarToken() {
  return new BehaviorSubject('Gregorian');
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'app-jdn-datepicker',
  providers: [
    {
      provide: DateAdapter,
      useClass: JDNConvertibleCalendarDateAdapter,
      deps: [MAT_DATE_LOCALE, ACTIVE_CALENDAR],
    },
    { provide: ACTIVE_CALENDAR, useFactory: makeCalendarToken },
  ],
  standalone: false,
})
export class JDNDatepickerDirective implements OnChanges, OnDestroy {
  private _activeCalendar!: 'Gregorian' | 'Julian' | 'Islamic';

  constructor(@Inject(ACTIVE_CALENDAR) private _activeCalendarToken: any) {}

  get activeCalendar() {
    return this._activeCalendar;
  }

  @Input()
  set activeCalendar(value: 'Gregorian' | 'Julian' | 'Islamic' | null) {
    if (value !== null && value !== undefined) {
      this._activeCalendar = value;
    } else {
      this._activeCalendar = 'Gregorian';
    }
  }

  ngOnChanges(): void {
    this._activeCalendarToken.next(this.activeCalendar);
  }

  ngOnDestroy(): void {
    this._activeCalendarToken.complete();
  }
}
