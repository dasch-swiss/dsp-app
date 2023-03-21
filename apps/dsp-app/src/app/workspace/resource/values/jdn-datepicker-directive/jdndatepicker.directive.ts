import {
    Directive,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { JDNConvertibleCalendar } from 'jdnconvertiblecalendar';
import {
    ACTIVE_CALENDAR,
    JDNConvertibleCalendarDateAdapter,
} from 'jdnconvertiblecalendardateadapter';
import { BehaviorSubject } from 'rxjs';

export function makeCalendarToken() {
    return new BehaviorSubject('Gregorian');
}

@Directive({
    selector: 'app-jdn-datepicker',
    providers: [
        {
            provide: DateAdapter,
            useClass: JDNConvertibleCalendarDateAdapter,
            deps: [MAT_DATE_LOCALE, ACTIVE_CALENDAR],
        },
        { provide: ACTIVE_CALENDAR, useFactory: makeCalendarToken },
    ],
})
export class JDNDatepickerDirective implements OnChanges, OnDestroy {
    private _activeCalendar: 'Gregorian' | 'Julian' | 'Islamic';

    constructor(
        @Inject(ACTIVE_CALENDAR) private _activeCalendarToken,
        private _adapter: DateAdapter<JDNConvertibleCalendar>
    ) {}

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

    ngOnChanges(changes: SimpleChanges): void {
        this._activeCalendarToken.next(this.activeCalendar);
    }

    ngOnDestroy(): void {
        this._activeCalendarToken.complete();
    }
}
