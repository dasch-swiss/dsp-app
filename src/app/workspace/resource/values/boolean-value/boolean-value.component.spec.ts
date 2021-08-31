import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BooleanValueComponent } from './boolean-value.component';
import { Component, OnInit, ViewChild, DebugElement } from '@angular/core';
import { ReadBooleanValue, MockResource, UpdateBooleanValue, CreateBooleanValue } from '@dasch-swiss/dsp-js';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormattedBooleanPipe } from 'src/app/main/pipes/formatting/formatted-boolean.pipe';

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
        let checkboxLabel;
        let commentBooleanDebugElement: DebugElement;
        let commentBooleanNativeElement;

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

            expect(valueReadModeNativeElement.innerText).toEqual('true');
        });

        it('should make an existing value editable', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;
            checkboxLabel = valueBooleanDebugElement.query(By.css('span[class="mat-checkbox-label"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            expect(checkboxLabel.innerText).toEqual('true');

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();

            expect((updatedValue as UpdateBooleanValue).bool).toBe(false);

            expect(checkboxEl.checked).toBe(false);

            expect(checkboxEl.disabled).toBe(false);

            expect(checkboxLabel.innerText).toEqual('false');
        });

        it('should validate an existing value with an added comment', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;
            checkboxLabel = valueBooleanDebugElement.query(By.css('span[class="mat-checkbox-label"]')).nativeElement;

            commentBooleanDebugElement = valueComponentDe.query(By.css('textarea.comment'));
            commentBooleanNativeElement = commentBooleanDebugElement.nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            expect(checkboxLabel.innerText).toEqual('true');

            commentBooleanNativeElement.value = 'this is a comment';

            commentBooleanNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();

            expect((updatedValue as UpdateBooleanValue).valueHasComment).toEqual('this is a comment');
        });

        it('should restore the initially displayed value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(By.css('mat-checkbox'));
            valueBooleanNativeElement = valueBooleanDebugElement.nativeElement;

            checkboxEl = valueBooleanDebugElement.query(By.css('input[type="checkbox"]')).nativeElement;
            checkboxLabel = valueBooleanDebugElement.query(By.css('span[class="mat-checkbox-label"]')).nativeElement;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(checkboxEl.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            expect(checkboxLabel.innerText).toEqual('true');

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(checkboxEl.checked).toBe(false);

            expect(checkboxLabel.innerText).toEqual('false');

            testHostComponent.booleanValueComponent.resetFormControl();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(checkboxEl.checked).toBe(true);

            expect(checkboxLabel.innerText).toEqual('true');
        });

        it('should set a new display value', () => {

            const newBool = new ReadBooleanValue();

            newBool.bool = false;
            newBool.id = 'updatedId';

            testHostComponent.displayBooleanVal = newBool;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual('false');

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
        });

        it('should unsubscribe when destroyed', () => {
            expect(testHostComponent.booleanValueComponent.valueChangesSubscription.closed).toBeFalsy();

            testHostComponent.booleanValueComponent.ngOnDestroy();

            expect(testHostComponent.booleanValueComponent.valueChangesSubscription.closed).toBeTruthy();
        });

    });

    describe('create a boolean value', () => {

        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let valueBooleanNativeElement;
        let checkboxEl;
        let checkboxLabel;
        let commentBooleanDebugElement: DebugElement;
        let commentBooleanNativeElement;

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
            checkboxLabel = valueBooleanDebugElement.query(By.css('span[class="mat-checkbox-label"]')).nativeElement;

            commentBooleanDebugElement = valueComponentDe.query(By.css('textarea.comment'));
            commentBooleanNativeElement = commentBooleanDebugElement.nativeElement;

            expect(testHostComponent.booleanValueComponent.displayValue).toEqual(undefined);
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
            expect(checkboxEl.disabled).toBe(false);
            expect(checkboxEl.checked).toBe(false);
            expect(checkboxLabel.innerText).toEqual('false');
            expect(commentBooleanNativeElement.value).toEqual('');
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

            commentBooleanNativeElement.value = 'created comment';

            commentBooleanNativeElement.dispatchEvent(new Event('input'));

            checkboxEl.click();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('create');

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            testHostComponent.booleanValueComponent.resetFormControl();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            expect(checkboxEl.checked).toBe(true);

            expect(commentBooleanNativeElement.value).toEqual('');

        });
    });

});
