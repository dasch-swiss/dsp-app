import { Component, OnInit } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { InvalidControlScrollDirective } from './invalid-control-scroll.directive';

@Component({
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()" appInvalidControlScroll>
            <div class="form-group">
                <label for="control1">Field 1</label>
                <input class="form-control" formControlName="control1"/>
            </div>
            <div class="form-group">
                <label for="control1">Field 2</label>
                <input class="form-control" formControlName="control2"/>
            </div>
            <div class="form-group">
                <label for="control1">Field 3</label>
                <input class="form-control" formControlName="control3"/>
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
        </form>
    `
})
class TestLinkHostComponent implements OnInit {

    form: UntypedFormGroup;

    constructor() { }

    ngOnInit() {
        this.form = new UntypedFormGroup({
            control1: new UntypedFormControl(),
            control2: new UntypedFormControl(),
            control3: new UntypedFormControl()
        });
    }

    onSubmit() {
        console.log('form submitted');
    }
}

describe('InvalidControlScrollDirective', () => {

    let testHostComponent: TestLinkHostComponent;
    let testHostFixture: ComponentFixture<TestLinkHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                InvalidControlScrollDirective,
                TestLinkHostComponent
            ],
            imports: [
                ReactiveFormsModule
            ]
        });

        testHostFixture = TestBed.createComponent(TestLinkHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();

    });

    it('should create an instance', () => {
        expect(testHostComponent).toBeTruthy();
    });
});
