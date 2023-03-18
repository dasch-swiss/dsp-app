import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { Interval, IntervalInputComponent } from './interval-input.component';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <div [formGroup]="form">
      <mat-form-field>
        <app-interval-input #intervalInput [formControlName]="'interval'"></app-interval-input>
      </mat-form-field>
    </div>`
})
class TestHostComponent implements OnInit {

    @ViewChild('intervalInput') intervalInputComponent: IntervalInputComponent;

    form: UntypedFormGroup;

    constructor(private _fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            interval: [new Interval(1, 2)]
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
        <app-interval-input #intervalInput [formControlName]="'interval'" [valueRequiredValidator]="false"></app-interval-input>
      </mat-form-field>
    </div>`
})
class NoValueRequiredTestHostComponent implements OnInit {

    @ViewChild('intervalInput') intervalInputComponent: IntervalInputComponent;

    form: UntypedFormGroup;

    constructor(private _fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            interval: new UntypedFormControl(null)
        });

    }
}

describe('IntervalInputComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let intervalInputComponentDe: DebugElement;
    let startInputDebugElement: DebugElement;
    let startInputNativeElement;
    let endInputDebugElement: DebugElement;
    let endInputNativeElement;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule],
            declarations: [IntervalInputComponent, TestHostComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.intervalInputComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        intervalInputComponentDe = hostCompDe.query(By.directive(IntervalInputComponent));
        startInputDebugElement = intervalInputComponentDe.query(By.css('input.start'));
        startInputNativeElement = startInputDebugElement.nativeElement;
        endInputDebugElement = intervalInputComponentDe.query(By.css('input.end'));
        endInputNativeElement = endInputDebugElement.nativeElement;
    });

    it('should initialize the interval correctly', () => {

        expect(startInputNativeElement.value).toEqual('1');
        expect(endInputNativeElement.value).toEqual('2');

    });

    it('should propagate changes made by the user', () => {

        startInputNativeElement.value = '3';
        startInputNativeElement.dispatchEvent(new Event('input'));

        testHostFixture.detectChanges();

        expect(testHostComponent.form.controls.interval).toBeTruthy();
        expect(testHostComponent.form.controls.interval.value.start).toEqual(3);
        expect(testHostComponent.form.controls.interval.value.end).toEqual(2);

        endInputNativeElement.value = '35';
        endInputNativeElement.dispatchEvent(new Event('input'));

        testHostFixture.detectChanges();

        expect(testHostComponent.form.controls.interval.value).toBeTruthy();
        expect(testHostComponent.form.controls.interval.value.start).toEqual(3);
        expect(testHostComponent.form.controls.interval.value.end).toEqual(35);

    });

    it('should return "null" for an empty (invalid) user input', () => {

        startInputNativeElement.value = '';
        startInputNativeElement.dispatchEvent(new Event('input'));

        endInputNativeElement.value = '';
        endInputNativeElement.dispatchEvent(new Event('input'));

        testHostFixture.detectChanges();

        expect(testHostComponent.form.controls.interval.value).toBe(null);
    });

    it('should initialize the interval with an empty value', () => {

        testHostComponent.form.controls.interval.setValue(null);
        expect(startInputNativeElement.value).toEqual('');
        expect(endInputNativeElement.value).toEqual('');

    });

    it('should mark the form\'s validity correctly', () => {
        expect(testHostComponent.intervalInputComponent.valueRequiredValidator).toBe(true);
        expect(testHostComponent.intervalInputComponent.form.valid).toBe(true);

        testHostComponent.intervalInputComponent.startIntervalControl.setValue(null);

        testHostComponent.intervalInputComponent._handleInput();

        expect(testHostComponent.intervalInputComponent.form.valid).toBe(false);
    });

});

describe('InvertalInputComponent', () => {
    let testHostComponent: NoValueRequiredTestHostComponent;
    let testHostFixture: ComponentFixture<NoValueRequiredTestHostComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule],
            declarations: [IntervalInputComponent, NoValueRequiredTestHostComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(NoValueRequiredTestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should receive the propagated valueRequiredValidator from the parent component', () => {
        expect(testHostComponent.intervalInputComponent.valueRequiredValidator).toBe(false);
    });

    it('should mark the form\'s validity correctly', () => {
        expect(testHostComponent.intervalInputComponent.form.valid).toBe(true);

        testHostComponent.intervalInputComponent.startIntervalControl.setValue(1);

        testHostComponent.intervalInputComponent._handleInput();

        expect(testHostComponent.intervalInputComponent.form.valid).toBe(false);
    });

});
