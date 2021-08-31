import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DateEditComponent } from './date-edit.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatRadioModule } from '@angular/material/radio';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatSelectModule } from '@angular/material/select';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <div [formGroup]="form">
            <mat-form-field>
                <app-date-edit #dateEdit [formControlName]="'date'" [calendar]="calendar"></app-date-edit>
            </mat-form-field>
        </div>`
})
class TestHostComponent implements OnInit {

    @ViewChild('dateEdit') dateEditComponent: DateEditComponent;

    form: FormGroup;

    calendar = 'JULIAN';

    constructor(private _fb: FormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            date: [new KnoraDate('JULIAN', 'CE', 2018, 5, 19)]
        });

    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <div [formGroup]="form">
            <mat-form-field>
                <app-date-edit #dateEdit [formControlName]="'date'" [calendar]="calendar" [valueRequiredValidator]="false"></app-date-edit>
            </mat-form-field>
        </div>`
})
class TestHostComponentNoValueRequiredComponent implements OnInit {

    @ViewChild('dateEdit') dateEditComponent: DateEditComponent;

    form: FormGroup;

    calendar = 'JULIAN';

    constructor(private _fb: FormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            date: [null]
        });

    }
}

describe('DateEditComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatRadioModule,
                BrowserAnimationsModule,
                MatSelectModule
            ],
            declarations: [DateEditComponent, TestHostComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should initialize a date with day precision correctly', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.calendar).toEqual('JULIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2018);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(5);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(19);
        expect(testHostComponent.dateEditComponent.form.valid).toBeTrue();

        const value = testHostComponent.dateEditComponent.value;

        expect(value.calendar).toEqual('JULIAN');
        expect(value.year).toEqual(2018);
        expect(value.month).toEqual(5);
        expect(value.day).toEqual(19);

        const eraRadioGroup = await loader.getHarness(MatRadioGroupHarness.with({ selector: '.era' }));
        expect(await (await eraRadioGroup.getCheckedRadioButton()).getValue()).toEqual('CE');

        const yearInput = await loader.getHarness(MatInputHarness.with({ selector: '.year' }));
        expect(await yearInput.getValue()).toEqual('2018');
        expect(await yearInput.isDisabled()).toBeFalse();

        const monthInput = await loader.getHarness(MatSelectHarness.with({ selector: '.month' }));
        expect(await monthInput.getValueText()).toEqual('5');
        expect(await monthInput.isDisabled()).toBeFalse();

        const dayInput = await loader.getHarness(MatSelectHarness.with({ selector: '.day' }));
        expect(await dayInput.getValueText()).toEqual('19');
        expect(await dayInput.isDisabled()).toBeFalse();

    });

    it('should initialize a date with month precision correctly', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        testHostComponent.form.controls.date.setValue(new KnoraDate('JULIAN', 'CE', 2018, 5));

        expect(testHostComponent.dateEditComponent.calendar).toEqual('JULIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2018);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(5);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(null);
        expect(testHostComponent.dateEditComponent.form.valid).toBeTrue();

        const value = testHostComponent.dateEditComponent.value;

        expect(value.calendar).toEqual('JULIAN');
        expect(value.year).toEqual(2018);
        expect(value.month).toEqual(5);
        expect(value.day).toBeUndefined();

        const eraRadioGroup = await loader.getHarness(MatRadioGroupHarness.with({ selector: '.era' }));
        expect(await (await eraRadioGroup.getCheckedRadioButton()).getValue()).toEqual('CE');

        const yearInput = await loader.getHarness(MatInputHarness.with({ selector: '.year' }));
        expect(await yearInput.getValue()).toEqual('2018');
        expect(await yearInput.isDisabled()).toBeFalse();

        const monthInput = await loader.getHarness(MatSelectHarness.with({ selector: '.month' }));
        expect(await monthInput.getValueText()).toEqual('5');
        expect(await monthInput.isDisabled()).toBeFalse();

        const dayInput = await loader.getHarness(MatSelectHarness.with({ selector: '.day' }));
        expect(await dayInput.getValueText()).toEqual('');
        expect(await dayInput.isDisabled()).toBeFalse();

    });

    it('should initialize a date with year precision correctly', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        testHostComponent.form.controls.date.setValue(new KnoraDate('JULIAN', 'CE', 2018));

        expect(testHostComponent.dateEditComponent.calendar).toEqual('JULIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2018);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(null);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(null);
        expect(testHostComponent.dateEditComponent.form.valid).toBeTrue();

        const value = testHostComponent.dateEditComponent.value;

        expect(value.calendar).toEqual('JULIAN');
        expect(value.year).toEqual(2018);
        expect(value.month).toBeUndefined();
        expect(value.day).toBeUndefined();

        const eraRadioGroup = await loader.getHarness(MatRadioGroupHarness.with({ selector: '.era' }));
        expect(await (await eraRadioGroup.getCheckedRadioButton()).getValue()).toEqual('CE');

        const yearInput = await loader.getHarness(MatInputHarness.with({ selector: '.year' }));
        expect(await yearInput.getValue()).toEqual('2018');
        expect(await yearInput.isDisabled()).toBeFalse();

        const monthInput = await loader.getHarness(MatSelectHarness.with({ selector: '.month' }));
        expect(await monthInput.getValueText()).toEqual('');
        expect(await monthInput.isDisabled()).toBeFalse();

        const dayInput = await loader.getHarness(MatSelectHarness.with({ selector: '.day' }));
        expect(await dayInput.getValueText()).toEqual('');
        expect(await dayInput.isDisabled()).toBeTrue();

    });

    it('should set CE era for an empty value in the Julian calendar', async () => {

        testHostComponent.form.controls.date.setValue(null);

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.eraControl.enabled).toBeTrue();

        expect(testHostComponent.dateEditComponent.value).toEqual(null);

    });

    it('should disable era for an empty value in the ISLAMIC calendar', async () => {

        testHostComponent.form.controls.date.setValue(null);

        testHostComponent.calendar = 'ISLAMIC';

        testHostFixture.detectChanges();

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toBeNull();
        expect(testHostComponent.dateEditComponent.eraControl.disabled).toBeTrue();

        expect(testHostComponent.dateEditComponent.value).toEqual(null);

    });

    it('should disable era for an ISLAMIC calendar date', async () => {

        testHostComponent.form.controls.date.setValue(new KnoraDate('ISLAMIC', 'noEra', 1441));

        testHostComponent.calendar = 'ISLAMIC';

        testHostFixture.detectChanges();

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toBeNull();
        expect(testHostComponent.dateEditComponent.eraControl.disabled).toBeTrue();

        expect(testHostComponent.dateEditComponent.value).toEqual(new KnoraDate('ISLAMIC', 'noEra', 1441));

    });

    it('should disable era when changing to the ISLAMIC calendar', async () => {

        testHostComponent.calendar = 'ISLAMIC';

        testHostFixture.detectChanges();

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toBeNull();
        expect(testHostComponent.dateEditComponent.eraControl.disabled).toBeTrue();

        expect(testHostComponent.dateEditComponent.value).toEqual(new KnoraDate('ISLAMIC', 'noEra', 2018, 5, 19));

    });

    it('should enable era when changing from the Islamic calendar to the Gregorian calendar', async () => {

        testHostComponent.calendar = 'ISLAMIC';

        testHostFixture.detectChanges();

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toBeNull();
        expect(testHostComponent.dateEditComponent.eraControl.disabled).toBeTrue();

        testHostComponent.calendar = 'GREGORIAN';

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.eraControl.enabled).toBeTrue();

    });

    it('should react to changing the calendar', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.calendar).toEqual('JULIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2018);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(5);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(19);

        const value = testHostComponent.dateEditComponent.value;

        expect(value.calendar).toEqual('JULIAN');
        expect(value.year).toEqual(2018);
        expect(value.month).toEqual(5);
        expect(value.day).toEqual(19);

        const eraRadioGroup = await loader.getHarness(MatRadioGroupHarness.with({ selector: '.era' }));
        expect(await (await eraRadioGroup.getCheckedRadioButton()).getValue()).toEqual('CE');

        const yearInput = await loader.getHarness(MatInputHarness.with({ selector: '.year' }));
        expect(await yearInput.getValue()).toEqual('2018');

        const monthInput = await loader.getHarness(MatSelectHarness.with({ selector: '.month' }));
        expect(await monthInput.getValueText()).toEqual('5');

        const dayInput = await loader.getHarness(MatSelectHarness.with({ selector: '.day' }));
        expect(await dayInput.getValueText()).toEqual('19');

        // change calendar @Input
        testHostComponent.calendar = 'GREGORIAN';

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        const newValue = testHostComponent.dateEditComponent.value;

        expect(newValue.calendar).toEqual('GREGORIAN');
        expect(newValue.era).toEqual('CE');
        expect(value.year).toEqual(2018);
        expect(value.month).toEqual(5);
        expect(value.day).toEqual(19);

    });

    it('should reinit the days when changing the calendar', async () => {

        testHostComponent.form.controls.date.setValue(new KnoraDate('JULIAN', 'CE', 2021, 3, 31));

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(31);

        // change to Islamic calendar
        testHostComponent.calendar = 'ISLAMIC';

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(30);

    });

    it('should reinit the day selection when month changes', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.calendar).toEqual('JULIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2018);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(5);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(19);

        const dayInput = await loader.getHarness(MatSelectHarness.with({ selector: '.day' }));

        await dayInput.clickOptions();
        expect((await dayInput.getOptions()).length).toEqual(32); // 31 + null

        const monthInput = await loader.getHarness(MatSelectHarness.with({ selector: '.month' }));

        await monthInput.clickOptions();

        // choose February
        const opts = await monthInput.getOptions();
        expect(await opts[2].getText()).toEqual('2');
        await opts[2].click();

        await testHostFixture.whenStable();

        // last day of February 2019 is 28
        await dayInput.clickOptions();
        const opts2 = await dayInput.getOptions();
        expect(opts2.length).toEqual(29); // 28 + null
        expect(await opts2[28].getText()).toEqual('28');

        await opts2[28].click();

        const value = testHostComponent.dateEditComponent.value;
        expect(value.calendar).toEqual('JULIAN');
        expect(value.year).toEqual(2018);
        expect(value.month).toEqual(2);
        expect(value.day).toEqual(28);

    });

    it('should change day selection to the latest possible day of the month when changing month selection', async () => {

        testHostComponent.calendar = 'GREGORIAN';

        testHostFixture.detectChanges();

        testHostComponent.form.controls.date.setValue(new KnoraDate('GREGORIAN', 'CE', 2021, 3, 31));

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.calendar).toEqual('GREGORIAN');
        expect(testHostComponent.dateEditComponent.eraControl.value).toEqual('CE');
        expect(testHostComponent.dateEditComponent.yearControl.value).toEqual(2021);
        expect(testHostComponent.dateEditComponent.monthControl.value).toEqual(3);
        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(31);

        testHostComponent.dateEditComponent.monthControl.setValue(2);

        expect(testHostComponent.dateEditComponent.dayControl.value).toEqual(28);

    });

    it('should consider a date without a year invalid', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        testHostComponent.dateEditComponent.yearControl.setValue(null);

        expect(testHostComponent.dateEditComponent.form.valid).toBeFalse();

    });

});

describe('DateEditComponent (no validator required)', () => {
    let testHostComponent: TestHostComponentNoValueRequiredComponent;
    let testHostFixture: ComponentFixture<TestHostComponentNoValueRequiredComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatRadioModule,
                BrowserAnimationsModule,
                MatSelectModule
            ],
            declarations: [DateEditComponent, TestHostComponentNoValueRequiredComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponentNoValueRequiredComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should be valid for an empty form (null)', async () => {

        // init involves various "value changes" callbacks
        await testHostFixture.whenStable();

        expect(testHostComponent.dateEditComponent.form.valid).toBeTrue();

        expect(testHostComponent.form.controls.date.value).toEqual(null);


    });

});

