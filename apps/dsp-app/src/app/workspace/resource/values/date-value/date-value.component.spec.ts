import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
    Component,
    DebugElement,
    forwardRef,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
    ControlValueAccessor,
    NgControl,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatLegacyFormFieldControl as MatFormFieldControl } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    CreateDateValue,
    KnoraDate,
    KnoraPeriod,
    MockResource,
    ReadDateValue,
    UpdateDateValue,
} from '@dasch-swiss/dsp-js';
import { Subject } from 'rxjs';
import { KnoraDatePipe } from '@dsp-app/src/app/main/pipes/formatting/knoradate.pipe';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { DateValueComponent } from './date-value.component';

@Component({
    selector: 'app-date-value-handler',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestDateInputComponent),
        },
        { provide: MatFormFieldControl, useExisting: TestDateInputComponent },
    ],
})
class TestDateInputComponent
    implements ControlValueAccessor, MatFormFieldControl<any>
{
    @Input() value;
    @Input() disabled: boolean;
    @Input() empty: boolean;
    @Input() placeholder: string;
    @Input() required: boolean;
    @Input() shouldLabelFloat: boolean;
    @Input() errorStateMatcher: ErrorStateMatcher;
    @Input() valueRequiredValidator = true;

    stateChanges = new Subject<void>();
    errorState = false;
    focused = false;
    id = 'testid';
    ngControl: NgControl | null;
    onChange = (_: any) => {};

    writeValue(date: KnoraDate | KnoraPeriod | null): void {
        this.value = date;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {}

    onContainerClick(event: MouseEvent): void {}

    setDescribedByIds(ids: string[]): void {}

    handleInput(): void {
        this.onChange(this.value);
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-date-value
        #inputVal
        [displayValue]="displayInputVal"
        [mode]="mode"
    ></app-date-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: DateValueComponent;

    displayInputVal: ReadDateValue;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            const inputVal: ReadDateValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
                ReadDateValue
            )[0];

            this.displayInputVal = inputVal;

            this.mode = 'read';
        });
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-date-value #inputVal [mode]="mode"></app-date-value>`,
})
class TestHostCreateValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: DateValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-date-value
        #inputVal
        [mode]="mode"
        [valueRequiredValidator]="false"
    ></app-date-value>`,
})
class TestHostCreateValueNoValueRequiredComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: DateValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

describe('DateValueComponent', () => {
    let component: DateValueComponent;
    let fixture: ComponentFixture<DateValueComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule,
            ],
            declarations: [
                CommentFormComponent,
                DateValueComponent,
                TestDateInputComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
                TestHostCreateValueNoValueRequiredComponent,
                KnoraDatePipe,
            ],
        }).compileComponents();
    }));

    describe('display and edit a date value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let loader: HarnessLoader;

        let valueComponentDe: DebugElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostDisplayValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            loader = TestbedHarnessEnvironment.loader(testHostFixture);
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(
                By.directive(DateValueComponent)
            );
            valueReadModeDebugElement = valueComponentDe.query(
                By.css('.rm-value')
            );
            valueReadModeNativeElement =
                valueReadModeDebugElement.nativeElement;
        });

        it('should display an existing value', () => {
            expect(
                testHostComponent.inputValueComponent.displayValue.date
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual(
                'Gregorian\n13.05.2018'
            );
        });

        it('should make an existing value editable', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            // simulate user input
            const newKnoraDate = new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13);

            testHostComponent.inputValueComponent.datePickerComponent.value =
                newKnoraDate;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.valueFormControl.value
            ).toEqual(newKnoraDate);

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateDateValue).toBeTruthy();

            expect((updatedValue as UpdateDateValue).calendar).toEqual(
                'GREGORIAN'
            );
            expect((updatedValue as UpdateDateValue).startYear).toEqual(2019);
            expect((updatedValue as UpdateDateValue).endYear).toEqual(2019);
            expect((updatedValue as UpdateDateValue).startMonth).toEqual(5);
            expect((updatedValue as UpdateDateValue).endMonth).toEqual(5);
            expect((updatedValue as UpdateDateValue).startDay).toEqual(13);
            expect((updatedValue as UpdateDateValue).endDay).toEqual(13);
        });

        it('should not accept a user input equivalent to the existing value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            // simulate user input (equivalent date)
            const newKnoraDate = new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13);

            testHostComponent.inputValueComponent.datePickerComponent.value =
                newKnoraDate;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.valueFormControl.value
            ).toEqual(newKnoraDate);

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBe(false);
        });

        it('should validate an existing value with an added comment', async () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.displayValue.date
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy(); // because no value nor the comment changed

            // set a comment value
            testHostComponent.inputValueComponent.commentFormControl.setValue(
                'a comment'
            );

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy(); // now the form must be valid, hence the comment changed

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateDateValue).toBeTruthy();
        });

        it('should not return an invalid update value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            testHostComponent.inputValueComponent.datePickerComponent.value =
                null;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();
        });

        it('should restore the initially displayed value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            // simulate user input
            const newKnoraDate = new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13);

            testHostComponent.inputValueComponent.datePickerComponent.value =
                newKnoraDate;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.valueFormControl.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13));

            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13));

            testHostComponent.inputValueComponent.resetFormControl();

            expect(
                testHostComponent.inputValueComponent.valueFormControl.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13));

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
        });

        it('should set a new display value', (done) => {
            MockResource.getTestThing().subscribe((res) => {
                const newDate: ReadDateValue = res.getValuesAs(
                    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
                    ReadDateValue
                )[0];

                newDate.id = 'updatedId';

                newDate.date = new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13);

                testHostComponent.displayInputVal = newDate;

                testHostFixture.detectChanges();

                expect(
                    testHostComponent.inputValueComponent.valueFormControl.value
                ).toEqual(new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13));

                expect(valueReadModeNativeElement.innerText).toEqual(
                    'Gregorian\n13.05.2019'
                );

                expect(
                    testHostComponent.inputValueComponent.form.valid
                ).toBeTruthy();

                done();
            });
        });

        it('should compare two dates', () => {
            expect(
                testHostComponent.inputValueComponent.sameDate(
                    new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13),
                    new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13)
                )
            ).toEqual(true);

            expect(
                testHostComponent.inputValueComponent.sameDate(
                    new KnoraDate('JULIAN', 'CE', 2018, 5, 13),
                    new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13)
                )
            ).toEqual(false);

            expect(
                testHostComponent.inputValueComponent.sameDate(
                    new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13),
                    new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13)
                )
            ).toEqual(false);
        });

        it('should compare the existing version of a date to the user input', () => {
            // knoraDate('GREGORIAN', 'CE', 2018, 5, 13)
            const initValue: KnoraDate | KnoraPeriod =
                testHostComponent.inputValueComponent.getInitValue();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue,
                    new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13)
                )
            ).toBeTruthy();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue,
                    new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13)
                )
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue,
                    null
                )
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue,
                    new KnoraPeriod(
                        new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13),
                        new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13)
                    )
                )
            ).toBeFalsy();
        });

        it('should correctly populate an UpdateValue from a KnoraDate', () => {
            const date = new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13);

            const updateVal = new UpdateDateValue();

            testHostComponent.inputValueComponent.populateValue(
                updateVal,
                date
            );

            expect(updateVal.calendar).toEqual('GREGORIAN');
            expect(updateVal.startEra).toEqual('CE');
            expect(updateVal.startDay).toEqual(13);
            expect(updateVal.startMonth).toEqual(5);
            expect(updateVal.startYear).toEqual(2018);
            expect(updateVal.endEra).toEqual('CE');
            expect(updateVal.endDay).toEqual(13);
            expect(updateVal.endMonth).toEqual(5);
            expect(updateVal.endYear).toEqual(2018);
        });

        it('should correctly populate an UpdateValue from a KnoraDate with an Islamic calendar date', () => {
            const date = new KnoraDate('ISLAMIC', 'noEra', 1441);

            const updateVal = new UpdateDateValue();

            testHostComponent.inputValueComponent.populateValue(
                updateVal,
                date
            );

            expect(updateVal.calendar).toEqual('ISLAMIC');
            expect(updateVal.startEra).toBeUndefined();
            expect(updateVal.startDay).toBeUndefined();
            expect(updateVal.startMonth).toBeUndefined();
            expect(updateVal.startYear).toEqual(1441);
            expect(updateVal.endEra).toBeUndefined();
            expect(updateVal.endDay).toBeUndefined();
            expect(updateVal.endMonth).toBeUndefined();
            expect(updateVal.endYear).toEqual(1441);
        });

        it('should correctly populate an UpdateValue from a KnoraPeriod', () => {
            const dateStart = new KnoraDate('GREGORIAN', 'CE', 2018, 5, 13);
            const dateEnd = new KnoraDate('GREGORIAN', 'CE', 2019, 6, 14);

            const updateVal = new UpdateDateValue();

            testHostComponent.inputValueComponent.populateValue(
                updateVal,
                new KnoraPeriod(dateStart, dateEnd)
            );

            expect(updateVal.calendar).toEqual('GREGORIAN');
            expect(updateVal.startEra).toEqual('CE');
            expect(updateVal.startDay).toEqual(13);
            expect(updateVal.startMonth).toEqual(5);
            expect(updateVal.startYear).toEqual(2018);
            expect(updateVal.endEra).toEqual('CE');
            expect(updateVal.endDay).toEqual(14);
            expect(updateVal.endMonth).toEqual(6);
            expect(updateVal.endYear).toEqual(2019);
        });

        it('should correctly populate an UpdateValue from a KnoraPeriod with dates in different eras', () => {
            const dateStart = new KnoraDate('GREGORIAN', 'BCE', 2018, 5, 13);
            const dateEnd = new KnoraDate('GREGORIAN', 'CE', 2019, 6, 14);

            const updateVal = new UpdateDateValue();

            testHostComponent.inputValueComponent.populateValue(
                updateVal,
                new KnoraPeriod(dateStart, dateEnd)
            );

            expect(updateVal.calendar).toEqual('GREGORIAN');
            expect(updateVal.startEra).toEqual('BCE');
            expect(updateVal.startDay).toEqual(13);
            expect(updateVal.startMonth).toEqual(5);
            expect(updateVal.startYear).toEqual(2018);
            expect(updateVal.endEra).toEqual('CE');
            expect(updateVal.endDay).toEqual(14);
            expect(updateVal.endMonth).toEqual(6);
            expect(updateVal.endYear).toEqual(2019);
        });

        it('should correctly populate an UpdateValue from a KnoraPeriod with Islamic calendar dates', () => {
            const dateStart = new KnoraDate('ISLAMIC', 'noEra', 1441);
            const dateEnd = new KnoraDate('ISLAMIC', 'noEra', 1442);

            const updateVal = new UpdateDateValue();

            testHostComponent.inputValueComponent.populateValue(
                updateVal,
                new KnoraPeriod(dateStart, dateEnd)
            );

            expect(updateVal.calendar).toEqual('ISLAMIC');
            expect(updateVal.startEra).toBeUndefined();
            expect(updateVal.startDay).toBeUndefined();
            expect(updateVal.startMonth).toBeUndefined();
            expect(updateVal.startYear).toEqual(1441);
            expect(updateVal.endEra).toBeUndefined();
            expect(updateVal.endDay).toBeUndefined();
            expect(updateVal.endMonth).toBeUndefined();
            expect(updateVal.endYear).toEqual(1442);
        });
    });

    describe('create a date value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let loader: HarnessLoader;

        let valueComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostCreateValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            loader = TestbedHarnessEnvironment.loader(testHostFixture);
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(
                By.directive(DateValueComponent)
            );
        });

        it('should create a value', () => {
            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(null);

            // simulate user input
            const newKnoraDate = new KnoraDate('JULIAN', 'CE', 2019, 5, 13);

            testHostComponent.inputValueComponent.datePickerComponent.value =
                newKnoraDate;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const newValue =
                testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateDateValue).toBeTruthy();

            expect((newValue as CreateDateValue).calendar).toEqual('JULIAN');

            expect((newValue as CreateDateValue).startDay).toEqual(13);
            expect((newValue as CreateDateValue).endDay).toEqual(13);
            expect((newValue as CreateDateValue).startMonth).toEqual(5);
            expect((newValue as CreateDateValue).endMonth).toEqual(5);
            expect((newValue as CreateDateValue).startYear).toEqual(2019);
            expect((newValue as CreateDateValue).endYear).toEqual(2019);
        });

        it('should reset form after cancellation', async () => {
            // simulate user input
            const newKnoraDate = new KnoraDate('JULIAN', 'CE', 2019, 5, 13);

            testHostComponent.inputValueComponent.datePickerComponent.value =
                newKnoraDate;
            testHostComponent.inputValueComponent.datePickerComponent.handleInput();

            testHostFixture.detectChanges();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.datePickerComponent.value
            ).toEqual(null);
        });
    });

    describe('create a date value no required value', () => {
        let testHostComponent: TestHostCreateValueNoValueRequiredComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueNoValueRequiredComponent>;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostCreateValueNoValueRequiredComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();
        });

        it('should not create an empty value', () => {
            expect(testHostComponent.inputValueComponent.getNewValue()).toBe(
                false
            );
            expect(testHostComponent.inputValueComponent.form.valid).toBe(true);
        });

        it('should propagate valueRequiredValidator to child component', () => {
            expect(
                testHostComponent.inputValueComponent.valueRequiredValidator
            ).toBe(false);
        });
    });
});
