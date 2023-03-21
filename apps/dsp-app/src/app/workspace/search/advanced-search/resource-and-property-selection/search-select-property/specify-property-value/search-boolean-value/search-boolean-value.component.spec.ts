import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBooleanValueComponent } from './search-boolean-value.component';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ValueLiteral } from '../operator';
import { MatLegacyCheckboxHarness as MatCheckboxHarness } from '@angular/material/legacy-checkbox/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-boolean-value
        #boolVal
        [formGroup]="form"
    ></app-search-boolean-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('boolVal', { static: false })
    booleanValue: SearchBooleanValueComponent;

    form;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchBooleanValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatCheckboxModule,
            ],
            declarations: [SearchBooleanValueComponent, TestHostComponent],
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
        expect(testHostComponent.booleanValue).toBeTruthy();
    });

    it('should get a boolean literal true', async () => {
        const matCheckbox = await loader.getHarness(MatCheckboxHarness);

        await matCheckbox.check();

        const expectedIntLiteralVal = new ValueLiteral(
            'true',
            'http://www.w3.org/2001/XMLSchema#boolean'
        );

        expect(testHostComponent.booleanValue.getValue()).toEqual(
            expectedIntLiteralVal
        );
    });
});
