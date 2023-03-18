import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { BooleanValueComponent } from './boolean-value.component';
import { Component, OnInit, ViewChild, DebugElement } from '@angular/core';
import { ReadBooleanValue, MockResource, UpdateBooleanValue, CreateBooleanValue } from '@dasch-swiss/dsp-js';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormattedBooleanPipe } from 'src/app/main/pipes/formatting/formatted-boolean.pipe';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { MatIconModule } from '@angular/material/icon';


/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
  <app-boolean-value #booleanVal [displayValue]="displayBooleanVal" [mode]="mode"></app-boolean-value>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('booleanVal') booleanValueComponent: BooleanValueComponent;

    displayBooleanVal: ReadBooleanValue;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        MockResource.getTestThing().subscribe(res => {
            const booleanVal: ReadBooleanValue =
                res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean', ReadBooleanValue)[0];

            this.displayBooleanVal = booleanVal;

            this.mode = 'read';
        });
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
  <app-boolean-value #booleanVal [mode]="mode"></app-boolean-value>`
})
class TestHostCreateValueComponent implements OnInit {

    @ViewChild('booleanVal') booleanValueComponent: BooleanValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

describe('BooleanValueComponent', () => {

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                BooleanValueComponent,
                CommentFormComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
                FormattedBooleanPipe
            ],
            imports: [
                ReactiveFormsModule,
                MatCheckboxModule,
                MatInputModule,
                MatSelectModule,
                MatOptionModule,
                MatIconModule,
                BrowserAnimationsModule
            ]
        })
            .compileComponents();
    }));

    describe('display and edit a boolean value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let valueBooleanNativeElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;
        let checkboxEl;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.booleanValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;
            valueComponentDe = hostCompDe.query(By.directive(BooleanValueComponent));
            valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
            valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;

        });

        it('should display an existing value', () => {

            expect(testHostComponent.booleanValueComponent.displayValue.bool).toEqual(true);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual('check_box');
        });

        it('should make an existing value editable', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();

            expect((updatedValue as UpdateBooleanValue).bool).toBe(false);

            expect(checkboxEl.checked).toBe(false);

            expect(checkboxEl.disabled).toBe(false);

        });

        it('should validate an existing value with an added comment', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy(); // because the booleans value did not change. it is still == true

            expect(checkboxEl.checked).toBe(true);

            // set a comment value
            testHostComponent.booleanValueComponent.commentFormControl.setValue('a comment');

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy(); // the form is valid now, because the comments value changed
            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();

        });

        it('should restore the initially displayed value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(checkboxEl.checked).toBe(false);

            testHostComponent.booleanValueComponent.resetFormControl();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

        });

        it('should set a new display value', () => {

            const newBool = new ReadBooleanValue();

            newBool.bool = false;
            newBool.id = 'updatedId';

            testHostComponent.displayBooleanVal = newBool;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual('check_box_outline_blank');

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
        });
    });

    describe('create a boolean value', () => {

        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let valueBooleanNativeElement;
        let checkboxEl;

        beforeEach(() => {

            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.booleanValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(BooleanValueComponent));
            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;
            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.displayValue).toEqual(undefined);
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
            expect(checkboxEl.disabled).toBe(false);
            expect(checkboxEl.checked).toBe(false);
        });

        it('should create a value', () => {

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('create');

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const newValue = testHostComponent.booleanValueComponent.getNewValue();

            expect(newValue instanceof CreateBooleanValue).toBeTruthy();

            expect((newValue as CreateBooleanValue).bool).toEqual(true);
        });

        it('should reset form after cancellation', () => {

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('create');

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            testHostComponent.booleanValueComponent.resetFormControl();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            expect(checkboxEl.checked).toBe(true);

        });
    });

});
