import { Component, DebugElement, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockResource, ReadColorValue, UpdateColorValue, CreateColorValue } from '@dasch-swiss/dsp-js';
import { ColorPickerModule } from 'ngx-color-picker';
import { Subject } from 'rxjs';
import { ColorValueComponent } from './color-value.component';

@Component({
    selector: 'app-color-picker',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestColorPickerComponent),
        },
        { provide: MatFormFieldControl, useExisting: TestColorPickerComponent }
    ]
})
class TestColorPickerComponent implements ControlValueAccessor, MatFormFieldControl<any> {

    @Input() value;
    @Input() disabled: boolean;
    @Input() empty: boolean;
    @Input() placeholder: string;
    @Input() required: boolean;
    @Input() shouldLabelFloat: boolean;
    @Input() errorStateMatcher: ErrorStateMatcher;

    stateChanges = new Subject<void>();
    errorState = false;
    focused = false;
    id = 'testid';
    ngControl: NgControl | null;
    onChange = (_: any) => {
    };

    writeValue(colorValue: string | null): void {
        this.value = colorValue;
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
      <app-color-value #colorVal [displayValue]="displayColorVal" [mode]="mode" [showHexCode]="showColorHex"></app-color-value>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('colorVal') colorValueComponent: ColorValueComponent;

    displayColorVal: ReadColorValue;

    mode: 'read' | 'update' | 'create' | 'search';

    showColorHex = false;

    ngOnInit() {

        MockResource.getTestThing().subscribe(res => {
            const colorVal: ReadColorValue =
        res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor', ReadColorValue)[0];

            this.displayColorVal = colorVal;

            this.mode = 'read';
        });

    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-color-value #colorValue [mode]="mode"></app-color-value>`
})
class TestHostCreateValueComponent implements OnInit {

    @ViewChild('colorValue') colorValueComponent: ColorValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

describe('ColorValueComponent', () => {

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                MatFormFieldModule,
                MatInputModule,
                ReactiveFormsModule,
                ColorPickerModule,
                BrowserAnimationsModule
            ],
            declarations: [
                ColorValueComponent,
                TestColorPickerComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent
            ]
        })
            .compileComponents();
    }));

    describe('display and edit a color value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;

        let valueComponentDe: DebugElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;


        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.colorValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(ColorValueComponent));
            valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
            valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;

        });

        it('should display an existing value without a hex color code', () => {

            expect(testHostComponent.colorValueComponent.displayValue.color).toEqual('#ff3333');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.colorValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.style.backgroundColor).not.toBeUndefined();

            expect(valueReadModeNativeElement.innerText).toEqual('');

        });

        it('should display an existing value with a hex color code', () => {

            testHostComponent.showColorHex = true;

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.displayValue.color).toEqual('#ff3333');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.colorValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.style.backgroundColor).not.toBeUndefined();

            expect(valueReadModeNativeElement.innerText).toEqual('#ff3333');

        });

        it('should make an existing value editable', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('update');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.colorValueComponent.colorPickerComponent.value).toEqual('#ff3333');

            // simulate user input
            const newColor = '#b1b1b1';

            testHostComponent.colorValueComponent.colorPickerComponent.value = newColor;
            testHostComponent.colorValueComponent.colorPickerComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.valueFormControl.value).toBeTruthy();

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.colorValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateColorValue).toBeTruthy();

            expect((updatedValue as UpdateColorValue).color).toEqual('#b1b1b1');

        });

        it('should validate an existing value with an added comment', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('update');

            expect(testHostComponent.colorValueComponent.displayValue.color).toEqual('#ff3333');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy(); // because no value or comment changed

            // set a comment value
            testHostComponent.colorValueComponent.commentFormControl.setValue('a comment');
            testHostFixture.detectChanges();
            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy(); // because now the comment changed

            const updatedValue = testHostComponent.colorValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateColorValue).toBeTruthy();

        });

        it('should not return an invalid update value', () => {

            // simulate user input
            const newColor = '54iu45po';

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('update');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

            testHostComponent.colorValueComponent.colorPickerComponent.value = null;
            testHostComponent.colorValueComponent.colorPickerComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('update');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

            const updatedValue = testHostComponent.colorValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();

        });

        it('should restore the initially displayed value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('update');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

            // simulate user input
            const newColor = '#g7g7g7';

            testHostComponent.colorValueComponent.colorPickerComponent.value = newColor;
            testHostComponent.colorValueComponent.colorPickerComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.valueFormControl.value).toEqual('#g7g7g7');

            testHostComponent.colorValueComponent.resetFormControl();

            expect(testHostComponent.colorValueComponent.colorPickerComponent.value).toEqual('#ff3333');

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

        });

        it('should set a new display value', () => {

            const newColor = new ReadColorValue();

            newColor.color = '#d8d8d8';
            newColor.id = 'updatedId';

            testHostComponent.displayColorVal = newColor;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.style.backgroundColor).not.toBeUndefined();

            expect(valueReadModeNativeElement.innerText).toEqual('');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

        });

        it('should set a new display value not showing the hex color code', () => {

            const newColor = new ReadColorValue();

            newColor.color = '#d8d8d8';
            newColor.id = 'updatedId';

            testHostComponent.displayColorVal = newColor;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.style.backgroundColor).not.toBeUndefined();

            expect(valueReadModeNativeElement.innerText).toEqual('');
            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

        });

        it('should set a new display value showing the hex color code', () => {

            testHostComponent.showColorHex = true;

            const newColor = new ReadColorValue();

            newColor.color = '#d8d8d8';
            newColor.id = 'updatedId';

            testHostComponent.displayColorVal = newColor;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.style.backgroundColor).not.toBeUndefined();

            expect(valueReadModeNativeElement.innerText).toEqual('#d8d8d8');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

        });

        it('should unsubscribe when destroyed', () => {
            expect(testHostComponent.colorValueComponent.commentChangesSubscription.closed).toBeFalsy();

            testHostComponent.colorValueComponent.ngOnDestroy();

            expect(testHostComponent.colorValueComponent.commentChangesSubscription.closed).toBeTruthy();
        });

    });

    describe('create a color value', () => {

        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;

        let valueComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.colorValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(ColorValueComponent));
        });

        it('should create a value', () => {

            expect(testHostComponent.colorValueComponent.colorPickerComponent.value).toEqual(null);

            // simulate user input
            const newColor = '#f5f5f5';

            testHostComponent.colorValueComponent.colorPickerComponent.value = newColor;
            testHostComponent.colorValueComponent.colorPickerComponent._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('create');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

            const newValue = testHostComponent.colorValueComponent.getNewValue();

            expect(newValue instanceof CreateColorValue).toBeTruthy();

            expect((newValue as CreateColorValue).color).toEqual('#f5f5f5');

        });

        it('should reset form after cancellation', () => {
            // simulate user input
            const newColor = '#f8f8f8';

            testHostComponent.colorValueComponent.colorPickerComponent.value = newColor;
            testHostComponent.colorValueComponent.colorPickerComponent._handleInput();

            testHostFixture.detectChanges();

            testHostFixture.detectChanges();

            expect(testHostComponent.colorValueComponent.mode).toEqual('create');

            expect(testHostComponent.colorValueComponent.form.valid).toBeTruthy();

            testHostComponent.colorValueComponent.resetFormControl();

            expect(testHostComponent.colorValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.colorValueComponent.colorPickerComponent.value).toEqual(null);

        });

    });

});
