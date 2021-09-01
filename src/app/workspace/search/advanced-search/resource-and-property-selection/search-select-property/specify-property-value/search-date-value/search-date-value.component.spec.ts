import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarDate, CalendarPeriod, GregorianCalendarDate } from 'jdnconvertiblecalendar';
import { CalendarHeaderComponent } from 'src/app/workspace/resource/values/date-value/calendar-header/calendar-header.component';
import { JDNDatepickerDirective } from 'src/app/workspace/resource/values/jdn-datepicker-directive/jdndatepicker.directive';
import { ValueLiteral } from '../operator';
import { SearchDateValueComponent } from './search-date-value.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-date-value #dateVal [formGroup]="form"></app-search-date-value>`
})
class TestHostComponent implements OnInit {

    @ViewChild('dateVal', { static: false }) dateValue: SearchDateValueComponent;

    form;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchDateValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatDatepickerModule,
                MatNativeDateModule
            ],
            declarations: [
                CalendarHeaderComponent,
                JDNDatepickerDirective,
                SearchDateValueComponent,
                TestHostComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.dateValue).toBeTruthy();
    });

    it('should get a date', () => {

        const calDate = new CalendarDate(2018, 10, 30);
        testHostComponent.dateValue.form.controls['dateValue'].setValue(new GregorianCalendarDate(new CalendarPeriod(calDate, calDate)));

        const gregorianDate = new ValueLiteral('GREGORIAN:2018-10-30:2018-10-30', 'http://api.knora.org/ontology/knora-api/simple/v2#Date');

        const dateVal = testHostComponent.dateValue.getValue();

        expect(dateVal).toEqual(gregorianDate);

    });
});
