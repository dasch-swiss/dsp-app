import { Component, OnInit, ViewChild, DebugElement } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerComponent } from './color-picker.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColorPickerModule } from 'ngx-color-picker';
import { By } from '@angular/platform-browser';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <div [formGroup]="form">
      <mat-form-field>
        <app-color-picker #colorInput [formControlName]="'colorValue'"></app-color-picker>
      </mat-form-field>
    </div>`
})
class TestHostComponent implements OnInit {

    @ViewChild('colorInput') colorPickerComponent: ColorPickerComponent;

    form: UntypedFormGroup;

    constructor(private _fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({
            colorValue: '#901453'
        });

    }
}

describe('ColorPickerComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let colorPickerComponentDe: DebugElement;
    let colorInputDebugElement: DebugElement;
    let colorInputNativeElement;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ColorPickerModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule],
            declarations: [ColorPickerComponent, TestHostComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.colorPickerComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        colorPickerComponentDe = hostCompDe.query(By.directive(ColorPickerComponent));
        colorInputDebugElement = colorPickerComponentDe.query(By.css('input.color'));
        colorInputNativeElement = colorInputDebugElement.nativeElement;

        expect(colorInputNativeElement.getAttribute('ng-reflect-cp-disabled')).toEqual('false');
    });

    it('should initialize the color correctly', () => {
        expect(colorInputNativeElement.value).toEqual('#901453');
    });

    it('should propagate changes made by the user', () => {

        colorInputNativeElement.value = '#f1f1f1';
        colorInputNativeElement.dispatchEvent(new Event('input'));

        testHostFixture.detectChanges();

        expect(testHostComponent.form.controls.colorValue).toBeTruthy();
        expect(testHostComponent.form.controls.colorValue.value).toEqual('#f1f1f1');

    });

    it('should return "null" for an empty (invalid) input', () => {

        colorInputNativeElement.value = '';
        colorInputNativeElement.dispatchEvent(new Event('input'));

        testHostFixture.detectChanges();

        expect(testHostComponent.form.controls.colorValue.value).toEqual('');
    });

});
