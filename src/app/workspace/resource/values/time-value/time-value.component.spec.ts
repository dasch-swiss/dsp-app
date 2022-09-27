import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeValueComponent } from './time-value.component';
import { Component, DebugElement, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { CreateTimeValue, MockResource, ReadTimeValue, UpdateTimeValue } from '@dasch-swiss/dsp-js';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ErrorStateMatcher } from '@angular/material/core';

@Component({
    selector: 'app-time-input',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestTimeInputComponent),
        },
        { provide: MatFormFieldControl, useExisting: TestTimeInputComponent }
    ]
})
class TestTimeInputComponent implements ControlValueAccessor, MatFormFieldControl<any> {

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

    onChange = (_: any) => {
    };

    writeValue(dateTime: string | null): void {
        this.value = dateTime;
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

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-time-value #inputVal [displayValue]="displayInputVal" [mode]="mode"></app-time-value>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TimeValueComponent;

    displayInputVal: ReadTimeValue;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        MockResource.getTestThing().subscribe(res => {
            const inputVal: ReadTimeValue =
                res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp', ReadTimeValue)[0];

            this.displayInputVal = inputVal;

            this.mode = 'read';
        });

    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-time-value #inputVal [mode]="mode"></app-time-value>`
})
class TestHostCreateValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TimeValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        this.mode = 'create';
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
      <app-time-value #inputVal [mode]="mode" [valueRequiredValidator]="false"></app-time-value>`
})
class TestHostCreateValueNoValueRequiredComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TimeValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        this.mode = 'create';
    }
}

describe('TimeValueComponent', () => {
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                TimeValueComponent,
                TestHostDisplayValueComponent,
                TestTimeInputComponent,
                TestHostCreateValueComponent,
                TestHostCreateValueNoValueRequiredComponent
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule
            ]
        })
            .compileComponents();
    }));

    describe('display and edit a time value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;

        let valueComponentDe: DebugElement;
        let dateReadModeDebugElement: DebugElement;
        let dateReadModeNativeElement;

        let timeReadModeDebugElement: DebugElement;
        let timeReadModeNativeElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(TimeValueComponent));
            dateReadModeDebugElement = valueComponentDe.query(By.css('.rm-value.date'));
            dateReadModeNativeElement = dateReadModeDebugElement.nativeElement;

            timeReadModeDebugElement = valueComponentDe.query(By.css('.rm-value.time'));
            timeReadModeNativeElement = timeReadModeDebugElement.nativeElement;

        });

        it('should display an existing value', () => {

            expect(testHostComponent.inputValueComponent.displayValue.time).toEqual('2019-08-30T10:45:20.173572Z');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(dateReadModeNativeElement.innerText).toEqual('Date: Aug 30, 2019');
            expect(timeReadModeNativeElement.innerText).toEqual('Time: 12:45');

        });

        it('should make an existing value editable', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual('2019-08-30T10:45:20.173572Z');

            testHostComponent.inputValueComponent.timeInputComponent.value = '2019-06-30T00:00:00Z';

            testHostComponent.inputValueComponent.timeInputComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.valueFormControl.value).toBeTruthy();

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateTimeValue).toBeTruthy();

            expect((updatedValue as UpdateTimeValue).time).toEqual('2019-06-30T00:00:00Z');

        });

        it('should validate an existing value with han added comment', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual('2019-08-30T10:45:20.173572Z');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy(); // because no value nor the comment changed

            // set a comment value
            testHostComponent.inputValueComponent.commentFormControl.setValue('a comment');

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy(); // now the form must be valid, hence the comment changed

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateTimeValue).toBeTruthy();

        });

        it('should not return an invalid update value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            testHostComponent.inputValueComponent.timeInputComponent.value = '';
            testHostComponent.inputValueComponent.timeInputComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();

        });

        it('should restore the initially displayed value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual('2019-08-30T10:45:20.173572Z');

            testHostComponent.inputValueComponent.timeInputComponent.value = '2019-06-30T00:00:00Z';
            testHostComponent.inputValueComponent.timeInputComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual('2019-06-30T00:00:00Z');

            testHostComponent.inputValueComponent.resetFormControl();

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual('2019-08-30T10:45:20.173572Z');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

        });

        it('should set a new display value', () => {

            const newTime = new ReadTimeValue();

            newTime.time = '2019-07-04T00:00:00.000Z';
            newTime.id = 'updatedId';

            testHostComponent.displayInputVal = newTime;

            testHostFixture.detectChanges();

            expect(dateReadModeNativeElement.innerText).toEqual('Date: Jul 4, 2019');
            expect(timeReadModeNativeElement.innerText).toEqual('Time: 02:00');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

        });
    });

    describe('create a time value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;

        let valueComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(TimeValueComponent));
        });

        it('should create a value', () => {

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual(null);

            testHostComponent.inputValueComponent.timeInputComponent.value = '2019-01-01T11:00:00.000Z';
            testHostComponent.inputValueComponent.timeInputComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            const newValue = testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateTimeValue).toBeTruthy();

            expect((newValue as CreateTimeValue).time).toEqual('2019-01-01T11:00:00.000Z');
        });

        it('should reset form after cancellation', () => {

            testHostComponent.inputValueComponent.timeInputComponent.value = '2019-06-30T00:00:00Z';
            testHostComponent.inputValueComponent.timeInputComponent._handleInput();

            testHostFixture.detectChanges();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.inputValueComponent.timeInputComponent.value).toEqual(null);

        });
    });

    describe('create a time value no value required', () => {
        let testHostComponent: TestHostCreateValueNoValueRequiredComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueNoValueRequiredComponent>;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueNoValueRequiredComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
        });

        it('should not create an empty value', () => {
            expect(testHostComponent.inputValueComponent.getNewValue()).toBe(false);
            expect(testHostComponent.inputValueComponent.form.valid).toBe(true);
        });

        it('should propagate valueRequiredValidator to child component', () => {
            expect(testHostComponent.inputValueComponent.valueRequiredValidator).toBe(false);
        });

    });

});
