import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import {
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    NgControl,
    ReactiveFormsModule
} from '@angular/forms';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DateInputTextComponent } from './date-input-text.component';
import { ErrorStateMatcher, MatOptionModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatSelectHarness } from '@angular/material/select/testing';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <div [formGroup]="form">
            <mat-form-field>
                <app-date-input-text #dateInputText [formControlName]="'date'"></app-date-input-text>
            </mat-form-field>
        </div>`
})
class TestHostComponent implements OnInit {

    @ViewChild('dateInputText') dateInputTextComponent: DateInputTextComponent;

    form: FormGroup;

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
                <app-date-input-text #dateInputText [formControlName]="'date'"
                                     [valueRequiredValidator]="false"></app-date-input-text>
            </mat-form-field>
        </div>`
})
class NoValueRequiredTestHostComponent implements OnInit {

    @ViewChild('dateInputText') dateInputTextComponent: DateInputTextComponent;

    form: FormGroup;

    constructor(private _fb: FormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            date: new FormControl(null)
        });

    }
}

@Component({
    selector: 'app-date-edit',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestDateEditComponent),
        },
        { provide: MatFormFieldControl, useExisting: TestDateEditComponent }
    ]
})

class TestDateEditComponent implements ControlValueAccessor, MatFormFieldControl<any> {

    @Input() value;
    @Input() disabled: boolean;
    @Input() empty: boolean;
    @Input() placeholder: string;
    @Input() required: boolean;
    @Input() shouldLabelFloat: boolean;
    @Input() errorStateMatcher: ErrorStateMatcher;
    @Input() valueRequiredValidator = true;

    @Input() calendar: string;
    stateChanges = new Subject<void>();

    errorState = false;
    focused = false;
    id = 'testid';
    ngControl: NgControl | null;
    onChange = (_: any) => {};


    writeValue(date: KnoraDate | null): void {
        this.value = date;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
    }

    onContainerClick(event: MouseEvent): void {
    }

    setDescribedByIds(ids: string[]): void {
    }

    _handleInput(): void {
        this.onChange(this.value);
    }

}

describe('DateInputTextComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatSelectModule,
                MatOptionModule,
                MatCheckboxModule,
                BrowserAnimationsModule,
            ],
            declarations: [DateInputTextComponent, TestDateEditComponent, TestHostComponent]
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

    it('should initialize a date correctly', async () => {

        expect(testHostComponent.dateInputTextComponent.calendarControl.value).toEqual('JULIAN');

        expect(testHostComponent.dateInputTextComponent.startDate.value).toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

        expect(testHostComponent.dateInputTextComponent.isPeriodControl.value).toBeFalse();

        expect(testHostComponent.dateInputTextComponent.endDate.value).toBeNull();

        const hostCompDe = testHostFixture.debugElement;
        const dateEditComponentDe = hostCompDe.query(By.directive(TestDateEditComponent));

        expect((dateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        expect((dateEditComponentDe.componentInstance as TestDateEditComponent).value).toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(true);

        const calendarSelection = await  loader.getHarness(MatSelectHarness.with({ selector: '.calendar-selection' }));
        expect(await calendarSelection.getValueText()).toEqual('JULIAN');

        const periodCheckbox = await loader.getHarness(MatCheckboxHarness.with({ selector: '.period-checkbox' }));
        expect(await periodCheckbox.isChecked()).toEqual(false);

        expect(testHostComponent.dateInputTextComponent.value instanceof KnoraDate).toBe(true);

        expect(testHostComponent.dateInputTextComponent.value)
            .toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

    });

    it('should initialize a period correctly', async () => {

        testHostComponent.form.controls.date.setValue(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2018, 5, 19), new KnoraDate('JULIAN', 'CE', 2019, 5, 19)));

        expect(testHostComponent.dateInputTextComponent.calendarControl.value).toEqual('JULIAN');

        expect(testHostComponent.dateInputTextComponent.startDate.value).toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

        expect(testHostComponent.dateInputTextComponent.isPeriodControl.value).toBeTrue();

        expect(testHostComponent.dateInputTextComponent.endDate.value).toEqual(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));

        testHostFixture.detectChanges();

        const hostCompDe = testHostFixture.debugElement;

        const startDateEditComponentDe = hostCompDe.query(By.css('.start-date'));

        const endDateEditComponentDe = hostCompDe.query(By.css('.end-date'));

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).value).toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

        expect((endDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        expect((endDateEditComponentDe.componentInstance as TestDateEditComponent).value).toEqual(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(true);

        const calendarSelection = await  loader.getHarness(MatSelectHarness.with({ selector: '.calendar-selection' }));
        expect(await calendarSelection.getValueText()).toEqual('JULIAN');

        const periodCheckbox = await loader.getHarness(MatCheckboxHarness.with({ selector: '.period-checkbox' }));
        expect(await periodCheckbox.isChecked()).toEqual(true);

        expect(testHostComponent.dateInputTextComponent.value instanceof KnoraPeriod).toBe(true);

        expect(testHostComponent.dateInputTextComponent.value)
            .toEqual(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2018, 5, 19), new KnoraDate('JULIAN', 'CE', 2019, 5, 19)));


    });

    it('should react correctly to changing the calendar for a single date', () => {

        const hostCompDe = testHostFixture.debugElement;

        const startDateEditComponentDe = hostCompDe.query(By.css('.start-date'));

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        testHostComponent.dateInputTextComponent.calendarControl.setValue('ISLAMIC');

        testHostFixture.detectChanges();

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('ISLAMIC');

    });

    it('should react correctly to changing the calendar for a period', () => {

        testHostComponent.form.controls.date.setValue(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2018, 5, 19), new KnoraDate('JULIAN', 'CE', 2019, 5, 19)));

        expect(testHostComponent.dateInputTextComponent.calendarControl.value).toEqual('JULIAN');

        expect(testHostComponent.dateInputTextComponent.startDate.value).toEqual(new KnoraDate('JULIAN', 'CE', 2018, 5, 19));

        expect(testHostComponent.dateInputTextComponent.isPeriodControl.value).toBeTrue();

        expect(testHostComponent.dateInputTextComponent.endDate.value).toEqual(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));

        testHostFixture.detectChanges();

        const hostCompDe = testHostFixture.debugElement;

        const startDateEditComponentDe = hostCompDe.query(By.css('.start-date'));

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        const endDateEditComponentDe = hostCompDe.query(By.css('.end-date'));

        expect((endDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('JULIAN');

        testHostComponent.dateInputTextComponent.calendarControl.setValue('ISLAMIC');

        testHostFixture.detectChanges();

        expect((startDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('ISLAMIC');

        expect((endDateEditComponentDe.componentInstance as TestDateEditComponent).calendar).toEqual('ISLAMIC');

    });

    it('should propagate changes made by the user for a single date', async () => {

        const hostCompDe = testHostFixture.debugElement;

        const startDateEditComponentDe = hostCompDe.query(By.css('.start-date'));

        (startDateEditComponentDe.componentInstance as TestDateEditComponent).writeValue(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));
        (startDateEditComponentDe.componentInstance as TestDateEditComponent)._handleInput();

        await testHostFixture.whenStable();

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(true);

        expect(testHostComponent.form.controls.date.value).toEqual(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));
    });

    it('should propagate changes made by the user for a period', async () => {

        testHostComponent.dateInputTextComponent.isPeriodControl.setValue(true);

        testHostFixture.detectChanges();

        const hostCompDe = testHostFixture.debugElement;

        const startDateEditComponentDe = hostCompDe.query(By.css('.start-date'));

        (startDateEditComponentDe.componentInstance as TestDateEditComponent).writeValue(new KnoraDate('JULIAN', 'CE', 2019, 5, 19));
        (startDateEditComponentDe.componentInstance as TestDateEditComponent)._handleInput();

        const endDateEditComponentDe = hostCompDe.query(By.css('.end-date'));

        (endDateEditComponentDe.componentInstance as TestDateEditComponent).writeValue(new KnoraDate('JULIAN', 'CE', 2020, 5, 19));
        (endDateEditComponentDe.componentInstance as TestDateEditComponent)._handleInput();

        await testHostFixture.whenStable();

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(true);

        expect(testHostComponent.form.controls.date.value).toEqual(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2019, 5, 19), new KnoraDate('JULIAN', 'CE', 2020, 5, 19)));
    });

    it('should return "null" for an invalid user input (start date greater than end date)', async () => {

        testHostComponent.dateInputTextComponent.isPeriodControl.setValue(true);

        testHostComponent.dateInputTextComponent.startDate.setValue(new KnoraDate('JULIAN', 'CE', 2021, 5, 19));

        testHostComponent.dateInputTextComponent.endDate.setValue(new KnoraDate('JULIAN', 'CE', 2020, 5, 19));

        await testHostFixture.whenStable();

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(false);

        expect(testHostComponent.form.controls.date.value).toBeNull();
    });

    it('should return "null" for an invalid user input (start date greater than end date) 2', async () => {

        testHostComponent.dateInputTextComponent.isPeriodControl.setValue(true);

        testHostComponent.dateInputTextComponent.startDate.setValue(new KnoraDate('JULIAN', 'CE', 2021, 5, 19));

        testHostComponent.dateInputTextComponent.endDate.setValue(new KnoraDate('JULIAN', 'BCE', 2022, 5, 19));

        await testHostFixture.whenStable();

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(false);

        expect(testHostComponent.form.controls.date.value).toBeNull();
    });

    it('should initialize the date with an empty value', () => {

        testHostComponent.form.controls.date.setValue(null);

        expect(testHostComponent.dateInputTextComponent.startDate.value).toBe(null);
        expect(testHostComponent.dateInputTextComponent.isPeriodControl.value).toBe(false);
        expect(testHostComponent.dateInputTextComponent.endDate.value).toBe(null);
        expect(testHostComponent.dateInputTextComponent.calendarControl.value).toEqual('GREGORIAN');

        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(false);

    });

});

describe('DateInputTextComponent (no validator required)', () => {
    let testHostComponent: NoValueRequiredTestHostComponent;
    let testHostFixture: ComponentFixture<NoValueRequiredTestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatSelectModule,
                MatOptionModule,
                MatCheckboxModule,
                BrowserAnimationsModule,
            ],
            declarations: [DateInputTextComponent, TestDateEditComponent, NoValueRequiredTestHostComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(NoValueRequiredTestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should receive the propagated valueRequiredValidator from the parent component', () => {
        expect(testHostComponent.dateInputTextComponent.valueRequiredValidator).toBe(false);
    });

    it('should mark the form\'s validity correctly', () => {
        expect(testHostComponent.dateInputTextComponent.form.valid).toBe(true);
    });

});
