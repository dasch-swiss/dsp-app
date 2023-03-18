import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchUriValueComponent } from './search-uri-value.component';
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
    template: `
        <app-search-uri-value #uriVal [formGroup]="form"></app-search-uri-value>`
})
class TestHostComponent implements OnInit {

    @ViewChild('uriVal') uriValue: SearchUriValueComponent;

    form;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchUriValueComponent', () => {
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
                SearchUriValueComponent,
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
        expect(testHostComponent.uriValue).toBeTruthy();
    });

    it('should get a URI literal of test', async () => {
        const matInput = await loader.getHarness(MatInputHarness);

        await matInput.setValue('http://www.knora.org');

        const uriLiteralVal = new ValueLiteral('http://www.knora.org', 'http://www.w3.org/2001/XMLSchema#anyURI');

        expect(testHostComponent.uriValue.getValue()).toEqual(uriLiteralVal);
        expect(testHostComponent.uriValue.form.valid).toBe(true);

    });

});
