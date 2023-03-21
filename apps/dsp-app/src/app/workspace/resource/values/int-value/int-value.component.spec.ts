import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntValueComponent } from './int-value.component';
import {
    ReadIntValue,
    MockResource,
    UpdateIntValue,
    CreateIntValue,
} from '@dasch-swiss/dsp-js';
import {
    OnInit,
    Component,
    ViewChild,
    DebugElement,
    NO_ERRORS_SCHEMA,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';
import { CommentFormComponent } from '../comment-form/comment-form.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-int-value
        #inputVal
        [displayValue]="displayInputVal"
        [mode]="mode"
    ></app-int-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: IntValueComponent;

    displayInputVal: ReadIntValue;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            const inputVal: ReadIntValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger',
                ReadIntValue
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
    template: ` <app-int-value #inputVal [mode]="mode"></app-int-value>`,
})
class TestHostCreateValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: IntValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-int-value
        #inputVal
        [mode]="mode"
        [valueRequiredValidator]="false"
    ></app-int-value>`,
})
class TestHostCreateValueNoValueRequiredComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: IntValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

describe('IntValueComponent', () => {
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                CommentFormComponent,
                IntValueComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
                TestHostCreateValueNoValueRequiredComponent,
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule,
            ],
        }).compileComponents();
    }));

    describe('display and edit an integer value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        let loader: HarnessLoader;

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
                By.directive(IntValueComponent)
            );

            valueReadModeDebugElement = valueComponentDe.query(
                By.css('.rm-value')
            );
            valueReadModeNativeElement =
                valueReadModeDebugElement.nativeElement;
        });

        it('should display an existing value', () => {
            expect(
                testHostComponent.inputValueComponent.displayValue.int
            ).toEqual(1);

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual('1');
        });

        it('should make an existing value editable', async () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const inputElement = await loader.getHarness(
                MatInputHarness.with({ selector: '.value' })
            );

            expect(await inputElement.getValue()).toEqual('1');

            await inputElement.setValue('20');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateIntValue).toBeTruthy();

            expect((updatedValue as UpdateIntValue).int).toEqual(20);
        });

        it('should validate an existing value', async () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            const inputElement = await loader.getHarness(
                MatInputHarness.with({ selector: '.value' })
            );

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(await inputElement.getValue()).toEqual('1');

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            testHostComponent.inputValueComponent.commentFormControl.setValue(
                'this is a comment'
            );

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateIntValue).toBeTruthy();
        });

        it('should not return an invalid update value', async () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            const valueInputNativeElement =
                valueInputDebugElement.nativeElement;

            expect(valueInputNativeElement.value).toEqual('1');

            valueInputNativeElement.value = '1.5';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();
        });

        it('should restore the initially displayed value', async () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            const inputElement = await loader.getHarness(
                MatInputHarness.with({ selector: '.value' })
            );

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(await inputElement.getValue()).toEqual('1');

            await inputElement.setValue('20');

            testHostComponent.inputValueComponent.resetFormControl();

            expect(await inputElement.getValue()).toEqual('1');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
        });

        it('should set a new display value', () => {
            const newInt = new ReadIntValue();

            newInt.int = 20;
            newInt.id = 'updatedId';

            testHostComponent.displayInputVal = newInt;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual('20');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();
        });
    });

    describe('create an integer value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let inputElement: MatInputHarness;

        let loader: HarnessLoader;

        beforeEach(async () => {
            testHostFixture = TestBed.createComponent(
                TestHostCreateValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            loader = TestbedHarnessEnvironment.loader(testHostFixture);
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            inputElement = await loader.getHarness(
                MatInputHarness.with({ selector: '.value' })
            );

            expect(testHostComponent.inputValueComponent.displayValue).toEqual(
                undefined
            );
            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
            expect(await inputElement.getValue()).toEqual('');
        });

        it('should create a value', async () => {
            await inputElement.setValue('20');

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const newValue =
                testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateIntValue).toBeTruthy();

            expect((newValue as CreateIntValue).int).toEqual(20);
        });

        it('should reset form after cancellation', async () => {
            await inputElement.setValue('20');

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

            expect(await inputElement.getValue()).toEqual('');
        });
    });

    describe('create value no required value', () => {
        let testHostComponent: TestHostCreateValueNoValueRequiredComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueNoValueRequiredComponent>;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostCreateValueNoValueRequiredComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
        });

        it('should not create an empty value', () => {
            expect(testHostComponent.inputValueComponent.getNewValue()).toEqual(
                false
            );
        });
    });
});
