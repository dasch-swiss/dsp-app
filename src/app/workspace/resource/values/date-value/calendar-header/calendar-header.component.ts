/** custom header component containing a calendar format switcher */
import { JDNConvertibleCalendarDateAdapter } from 'jdnconvertiblecalendardateadapter';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JDNConvertibleCalendar } from 'jdnconvertiblecalendar';
import { MatCalendar, MatDatepickerContent } from '@angular/material/datepicker';
import { DateAdapter } from '@angular/material/core';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-calendar-header',
    templateUrl: './calendar-header.component.html',
    styleUrls: ['./calendar-header.component.scss']
})
export class CalendarHeaderComponent<D> implements OnInit, OnDestroy {
    form: FormGroup;
    formControl: FormControl;
    valueChangesSubscription: Subscription;

    // a list of supported calendars (Gregorian and Julian)
    supportedCalendars = ['Gregorian', 'Julian'];

    constructor(private _calendar: MatCalendar<JDNConvertibleCalendar>,
        private _dateAdapter: DateAdapter<JDNConvertibleCalendar>,
        private _datepickerContent: MatDatepickerContent<JDNConvertibleCalendar>,
        @Inject(FormBuilder) private _fb: FormBuilder) {
    }

    ngOnInit() {

        let activeCal;

        // get the currently active calendar from the date adapter
        if (this._dateAdapter instanceof JDNConvertibleCalendarDateAdapter) {
            activeCal = this._dateAdapter.activeCalendar;
        } else {
            console.log('date adapter is expected to be an instance of JDNConvertibleCalendarDateAdapter');
        }

        this.formControl = new FormControl(activeCal, Validators.required);

        // build a form for the calendar format selection
        this.form = this._fb.group({
            calendar: this.formControl
        });

        // do the conversion when the user selects another calendar format
        this.valueChangesSubscription = this.form.valueChanges.subscribe((data) => {
            // pass the target calendar format to the conversion method
            this.convertDate(data.calendar);
        });

    }

    ngOnDestroy(): void {
        if (this.valueChangesSubscription !== undefined) {
            this.valueChangesSubscription.unsubscribe();
        }
    }

    /**
     * converts the date into the target format.
     *
     * @param calendar the target calendar format.
     */
    convertDate(calendar: 'Gregorian' | 'Julian') {

        if (this._dateAdapter instanceof JDNConvertibleCalendarDateAdapter) {

            // convert the date into the target calendar format
            const convertedDate = this._dateAdapter.convertCalendar(this._calendar.activeDate, calendar);

            // set the new date
            this._calendar.activeDate = convertedDate;

            // select the new date in the datepicker UI
            this._datepickerContent.datepicker.select(convertedDate);

            // update view after calendar format conversion
            this._calendar.updateTodaysDate();
        } else {
            console.log('date adapter is expected to be an instance of JDNConvertibleCalendarDateAdapter');
        }
    }
}
