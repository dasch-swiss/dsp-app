import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchIntValueComponent } from './search-int-value.component';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { ValueLiteral } from '../operator';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-int-value #intVal [formGroup]="form"></app-search-int-value>`
})
class TestHostComponent implements OnInit {

    @ViewChild('intVal', { static: false }) integerValue: SearchIntValueComponent;

    form;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchIntValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatInputModule
            ],
            declarations: [
                SearchIntValueComponent,
                TestHostComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.integerValue).toBeTruthy();
    });

    it('should get an integer literal of 1', async () => {

        const matInput = await loader.getHarness(MatInputHarness);

        await matInput.setValue('1');

        const expectedIntLiteralVal = new ValueLiteral('1', 'http://www.w3.org/2001/XMLSchema#integer');

        expect(testHostComponent.integerValue.getValue()).toEqual(expectedIntLiteralVal);

    });

});
