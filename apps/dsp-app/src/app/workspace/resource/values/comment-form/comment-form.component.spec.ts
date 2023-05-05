import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentFormComponent } from './comment-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <div [formGroup]="form">
            <input formControlName="value" />
            <app-comment-form
                #commentComp
                [valueFormControlHasError]="hasError()"
                [(commentFormControl)]="commentFormControl"
                [valueFormControlValue]="valueFormControl.value"
            ></app-comment-form>
        </div>
    `,
})
class TestHostValueComponent implements OnInit {
    @ViewChild('commentComp') commentFormComponent: CommentFormComponent;
    form: FormGroup;
    valueFormControl: FormControl;
    commentFormControl: FormControl;

    constructor(private _fb: FormBuilder) {}

    ngOnInit() {
        this.valueFormControl = new FormControl(null);
        this.commentFormControl = new FormControl(null);

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl,
        });
    }

    /**
     * returns true if there is no property value or an invalid property value in the valueFormControl
     */
    hasError() {
        return (
            this.valueFormControl.hasError('pattern') ||
            this.valueFormControl.hasError('required')
        );
    }
}

describe('CommentFormComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CommentFormComponent, TestHostValueComponent],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                BrowserAnimationsModule,
            ],
        }).compileComponents();
    });

    describe('display and edit a comment', () => {
        let testHostFixture: ComponentFixture<TestHostValueComponent>;
        let component: TestHostValueComponent;
        let commentDe: DebugElement;
        let commentComponent: CommentFormComponent; // what we actually like to test

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostValueComponent);
            component = testHostFixture.componentInstance;
            // initialize the form control elements and the FormGroup
            testHostFixture.detectChanges();
            expect(component.commentFormControl).toBeTruthy();
            expect(component.valueFormControl).toBeTruthy();
            const hostCompDe = testHostFixture.debugElement;
            commentDe = hostCompDe.query(By.directive(CommentFormComponent));
            commentComponent = commentDe.componentInstance;
            testHostFixture.detectChanges();
        });
        it('should be disabled if no value is set in the valueFormControl', () => {
            // hence there is no value set in valueFormControl, the commentForm should be disabled/readOnly
            expect(commentComponent.disallowed).toBeTruthy();
            testHostFixture.detectChanges();
            // testing if the lock icon is set correctly
            const lockIcon =
                testHostFixture.debugElement.nativeElement.querySelector(
                    '.comment-lock'
                );
            expect(lockIcon).toBeTruthy();
        });

        it('should be enabled if a value is set in the valueFormControl', () => {
            // hence there is no value for valueFormControl set, the commentForm should be disabled/readOnly
            component.valueFormControl.setValue('a value');
            testHostFixture.detectChanges();
            expect(commentComponent.disallowed).toBeFalsy();
        });

        it('should warn if there is a comment but an invalid value', () => {
            // setting value and component in the parent component; testing in comment component
            component.commentFormControl.setValue('this is a comment');
            component.valueFormControl.setValue('a wrong value');
            // setting an error, so the formControl is set to Invalid
            component.valueFormControl.setErrors({
                pattern: { value: 'you entered an invalid value' },
            });
            testHostFixture.detectChanges();
            expect(component.commentFormControl.value).toBeTruthy(); // make sure there is a comment value
            expect(commentComponent.valueFormControlHasError); // testing hasError()
            const warnText =
                testHostFixture.debugElement.nativeElement.querySelector(
                    '.custom-error-message'
                );
            // test if warn text is displayed
            expect(warnText.innerText).toEqual(
                "This comment won't be saved if there is an invalid or an empty property value above."
            );
        });

        it('should warn if there is a comment but no value (null, undefined, empty string)', () => {
            // there should be already an error in the valueFormControl though, but it should still warn
            // even if there is no error, but a comment and no value
            const emptyValues = [null, '', undefined];
            emptyValues.forEach((val) => {
                component.valueFormControl.setValue(val);
                component.commentFormControl.setValue('this is a comment');
                testHostFixture.detectChanges();
                expect(component.commentFormControl.value).toBeTruthy(); // make sure there is a comment value
                const warnText =
                    testHostFixture.debugElement.nativeElement.querySelector(
                        '.custom-error-message'
                    );
                // test if warn text is displayed
                expect(warnText.innerText).toEqual(
                    "This comment won't be saved if there is an invalid or an empty property value above."
                );
                // testing if the lock icon is unset if there is a comment
                expect(commentComponent.commentFormControl.value).toBeTruthy();
            });
        });

        it('should lock the comment field if there is no value and no comment yet', () => {
            expect(component.commentFormControl.value).toBeFalsy(); // make sure there is no comment value
            expect(!commentComponent.valueFormControlHasError); // make sure there is no error
            expect(commentComponent.disallowed).toBeTruthy(); // testing if disallowed
            testHostFixture.detectChanges();
            // testing if the lock icon is set correctly
            const lockIcon =
                testHostFixture.debugElement.nativeElement.querySelector(
                    '.comment-lock'
                );
            expect(lockIcon).toBeTruthy();
        });
    });
});
