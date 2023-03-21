import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTextValueComponent } from './search-text-value.component';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HarnessLoader } from '@angular/cdk/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';
import { ValueLiteral } from '../operator';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-text-value
        #textVal
        [formGroup]="form"
    ></app-search-text-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('textVal') textValue: SearchTextValueComponent;

    form;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchTextValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatInputModule,
            ],
            declarations: [SearchTextValueComponent, TestHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.textValue).toBeTruthy();
    });

    it('should get a text literal "test"', async () => {
        const matInput = await loader.getHarness(MatInputHarness);

        await matInput.setValue('test');

        const textLiteralVal = new ValueLiteral(
            'test',
            'http://www.w3.org/2001/XMLSchema#string'
        );

        expect(testHostComponent.textValue.getValue()).toEqual(textLiteralVal);
    });
});
