import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { BooleanValueComponent } from './boolean-value.component';
import { Component, OnInit, ViewChild, DebugElement, Input } from '@angular/core';
import {
    ReadBooleanValue,
    MockResource,
    UpdateBooleanValue,
    CreateBooleanValue,
} from '@dasch-swiss/dsp-js';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormattedBooleanPipe } from '@dsp-app/src/app/main/pipes/formatting/formatted-boolean.pipe';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-boolean-value
        #booleanVal
        [displayValue]="displayBooleanVal"
        [mode]="mode"
    ></app-boolean-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
    @ViewChild('booleanVal') booleanValueComponent: BooleanValueComponent;

    displayBooleanVal: ReadBooleanValue;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            // testValue is set to true per default
            const booleanVal: ReadBooleanValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean',
                ReadBooleanValue
            )[0];

            this.displayBooleanVal = booleanVal;

            this.mode = 'read';
        });
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-boolean-value
        #booleanVal
        [mode]="mode"
        [newResource]="isNewResource"
        [valueRequiredValidator] = "isRequired"
    ></app-boolean-value>`,
})
class TestHostCreateValueComponent implements OnInit {
    @ViewChild('booleanVal') booleanValueComponent: BooleanValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    // Add @Input() decorator to the isRequired & isNewResource property,
    // so we can easily change it
    @Input() isRequired = true;
    @Input() isNewResource= false;

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
                FormattedBooleanPipe,
            ],
            imports: [
                ReactiveFormsModule,
                MatSlideToggleModule,
                MatInputModule,
                MatSelectModule,
                MatOptionModule,
                MatIconModule,
                BrowserAnimationsModule,
            ],
        }).compileComponents();
    }));

    describe('display and edit a boolean value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostDisplayValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.booleanValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;
            valueComponentDe = hostCompDe.query(
                By.directive(BooleanValueComponent)
            );
            valueReadModeDebugElement = valueComponentDe.query(
                By.css('.rm-value')
            );
            valueReadModeNativeElement =
                valueReadModeDebugElement.nativeElement;
        });

        it('should display an existing value', () => {
            expect(
                testHostComponent.booleanValueComponent.displayValue.bool
            ).toEqual(true);

            expect(
                testHostComponent.booleanValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.booleanValueComponent.mode).toEqual(
                'read'
            );

            expect(valueReadModeNativeElement.innerText).toEqual('check_box');
        });

        it('should make an existing value editable', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );

            const slideToggleElement = valueBooleanDebugElement.componentInstance;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(slideToggleElement.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(slideToggleElement.checked).toBe(true);

            slideToggleElement.toggle();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();

            expect((updatedValue as UpdateBooleanValue).bool).toBe(false);

            expect(slideToggleElement.checked).toBe(false);

            expect(slideToggleElement.disabled).toBe(false);
        });


        it('should validate an existing value with an added comment', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );

            const slideToggleElement = valueBooleanDebugElement.componentInstance;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(slideToggleElement.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(slideToggleElement.checked).toBe(true);

            // Set a comment value
            testHostComponent.booleanValueComponent.commentFormControl.setValue('a comment');

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.booleanValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateBooleanValue).toBeTruthy();
        });

        it('should restore the initially displayed value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );

            const slideToggleElement = valueBooleanDebugElement.componentInstance;

            expect(testHostComponent.booleanValueComponent.mode).toEqual('update');

            expect(slideToggleElement.disabled).toBe(false);

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(slideToggleElement.checked).toBe(true);

            slideToggleElement.toggle();

            testHostFixture.detectChanges();

            expect(slideToggleElement.checked).toBe(false);

            testHostComponent.booleanValueComponent.resetFormControl();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeFalsy();

            expect(slideToggleElement.checked).toBe(true);
        });

        it('should set a new display value', () => {
            const newBool = new ReadBooleanValue();

            newBool.bool = false;
            newBool.id = 'updatedId';

            testHostComponent.displayBooleanVal = newBool;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual(
                'check_box_outline_blank'
            );

            expect(
                testHostComponent.booleanValueComponent.form.valid
            ).toBeTruthy();
        });
    });

    describe('create a new boolean value if a value is required', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let slideToggleElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.nativeElement.isNewResource = true;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.booleanValueComponent).toBeTruthy();
            // check if it is really required (valueRequiredValidator defaults to true)
            expect(testHostComponent.booleanValueComponent.valueRequiredValidator).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(BooleanValueComponent));
            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );

            slideToggleElement = valueBooleanDebugElement.componentInstance;

            // upon creation a new resource, the default toggle state is false
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
            expect(slideToggleElement.disabled).toBe(false);
            expect(slideToggleElement.checked).toBe(false);
        });

        it('should create a value', () => {
            slideToggleElement.toggle();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('create');
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            const newValue = testHostComponent.booleanValueComponent.getNewValue();

            expect(newValue instanceof CreateBooleanValue).toBeTruthy();
            expect((newValue as CreateBooleanValue).bool).toEqual(true);
        });

        it('should reset form after cancellation', () => {
            slideToggleElement.toggle();

            testHostFixture.detectChanges();

            expect(testHostComponent.booleanValueComponent.mode).toEqual('create');
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            testHostComponent.booleanValueComponent.resetFormControl();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
            expect(slideToggleElement.checked).toBe(false);
        });
    });

    describe('display no toggle/value if the property is not required', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let valueBooleanDebugElement: DebugElement;
        let slideToggleElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            // set required to false
            testHostComponent.isRequired = false; // Set isRequired to false
            testHostComponent.isNewResource = true;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.booleanValueComponent).toBeTruthy();
            // it is not required
            expect(testHostComponent.booleanValueComponent.valueRequiredValidator).toEqual(false);

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(BooleanValueComponent));
            // the component is rendered
            expect(valueComponentDe).toBeTruthy();
            // but there is no toggle at all
            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );
            expect(valueBooleanDebugElement).toBeFalsy();

            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();
        });

        it('should add/set remove/unset boolean value properties', () => {
            // There is no boolean value
            expect(testHostComponent.booleanValueComponent.boolValIsUnset).toBe(true);
            expect(testHostComponent.booleanValueComponent.displayValue).toEqual(
                undefined
            );
            // the add button should be there by default
            const setValueButton = valueComponentDe.query(By.css('button.value-action.create'));
            expect(setValueButton).toBeTruthy();
            const setValueButtonNativeElement = setValueButton.nativeElement;

            // Add a toggle and a value by clicking the add button
            setValueButtonNativeElement.click();
            testHostFixture.detectChanges();

            // is there a toggle
            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );
            slideToggleElement = valueBooleanDebugElement.componentInstance;
            expect(slideToggleElement).toBeTruthy();

            // Toggle state:
            // upon adding a new value, the default toggle state is false
            expect(slideToggleElement.disabled).toBe(false);
            expect(slideToggleElement.checked).toBe(false);

            // valid form/value
            expect(testHostComponent.booleanValueComponent.form.valid).toBeTruthy();

            // the add button should disappear
            const setValueButtonNow = valueComponentDe.query(By.css('button.value-action.create'));
            expect(setValueButtonNow).toBeNull();

            // the remove button should appear
            const cancelButtonDebugElement = valueComponentDe.query(By.css('button.value-action.cancel'));
            const cancelButtonNativeElement = cancelButtonDebugElement.nativeElement;
            expect(cancelButtonNativeElement).toBeTruthy();

            // remove the toggle and the value by clicking the cancel button
            cancelButtonNativeElement.click();
            testHostFixture.detectChanges();

            // there no toggle anymore
            valueBooleanDebugElement = valueComponentDe.query(
                By.css('mat-slide-toggle')
            );
            expect(valueBooleanDebugElement).toBeNull();

            // there is no cancel button anymore
            // the remove button should appear
            const cancelButtonDebugElementNow = valueComponentDe.query(By.css('button.value-action.cancel'));
            expect(cancelButtonDebugElementNow).toBeNull();

        });
    });
});
