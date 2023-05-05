import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchDecimalValueComponent } from './search-decimal-value.component';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { ValueLiteral } from '../operator';
import { By } from '@angular/platform-browser';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-decimal-value
        #decVal
        [formGroup]="form"
    ></app-search-decimal-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('decVal', { static: false })
    decimalValue: SearchDecimalValueComponent;

    form;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('SearchDecimalValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatInputModule,
            ],
            declarations: [SearchDecimalValueComponent, TestHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.decimalValue).toBeTruthy();
    });

    it('should get a decimal literal of 1.1', () => {
        const hostCompDe = testHostFixture.debugElement;

        const decLiteralVal = new ValueLiteral(
            '1.1',
            'http://www.w3.org/2001/XMLSchema#decimal'
        );

        const decVal = hostCompDe.query(
            By.directive(SearchDecimalValueComponent)
        );

        const matInput = decVal.query(By.css('input'));

        matInput.nativeElement.value = '1.1';

        matInput.triggerEventHandler('input', {
            target: matInput.nativeElement,
        });

        testHostFixture.detectChanges();

        expect(testHostComponent.decimalValue.getValue()).toEqual(
            decLiteralVal
        );
    });
});
