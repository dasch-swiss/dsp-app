import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBooleanValueComponent } from './search-boolean-value.component';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ValueLiteral } from '../operator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-boolean-value
        #boolVal
        [formGroup]="fg"
    ></app-search-boolean-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('boolVal', { static: false })
    booleanValue: SearchBooleanValueComponent;

    fg;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.fg = this._fb.group({});
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
                MatTooltipModule,
                MatCheckboxModule,
                MatSlideToggleModule,
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
        const slideToggle = await loader.getHarness(MatSlideToggleHarness);

        await slideToggle.check();

        const expectedIntLiteralVal = new ValueLiteral(
            'true',
            'http://www.w3.org/2001/XMLSchema#boolean'
        );


        expect(testHostComponent.booleanValue.getValue()).toEqual(
            expectedIntLiteralVal
        );

    });
});
