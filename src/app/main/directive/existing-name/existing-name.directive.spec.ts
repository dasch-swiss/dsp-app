
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExistingNameDirective, existingNamesValidator } from './existing-name.directive';

@Component({
    template: `
    <div>
        <form [formGroup]="form">
            <mat-form-field>
                <input matInput [formControl]="form.controls['name']" [placeholder]="'Name (should be unique)'">
                <mat-hint *ngIf="formErrors.name">
                    {{formErrors.name}}
                </mat-hint>
            </mat-form-field>

            <button [disabled]="!form.valid">
                Submit
            </button>
        </form>
    </div>

    <ul>
        <li *ngFor="let n of dataMock">{{n}}</li>
    </ul>
    `
})
class TestHostComponent implements OnInit {

    dataMock: string[] = [
        'Ben', 'Tobias', 'André', 'Flavie', 'Ivan', 'Lucas', 'Mike'
    ];

    existingNames: [RegExp] = [
        new RegExp('user')
    ];

    form: UntypedFormGroup;

    formErrors = {
        name: ''
    };

    validationMessages = {
        name: {
            required: 'A name is required',
            existingName: 'This name exists already.'
        }
    };

    constructor(private _formBuilder: UntypedFormBuilder) { }

    ngOnInit() {
        // create a list of existing names
        let i = 1;
        for (const user of this.dataMock) {
            this.existingNames[i] = new RegExp('(?:^|W)' + user.toLowerCase() + '(?:$|W)');

            i++;
        }

        // build form
        this.form = this._formBuilder.group({
            name: new UntypedFormControl({
                value: '', disabled: false
            }, [
                Validators.required,
                existingNamesValidator(this.existingNames)
            ])
        });

        // detect changes in the form
        this.form.valueChanges.subscribe(
            data => this.onValueChanged(data)
        );

        this.onValueChanged();
    }

    onValueChanged(data?: any) {

        if (!this.form) {
            return;
        }

        // check if the form is valid
        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = this.form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });
            }
        });
    }
}

describe('ExistingNameDirective', () => {

    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    const existingNamesList: string[] = [
        'Ben', 'Tobias', 'André', 'Flavie', 'Ivan', 'Lucas', 'Mike'
    ];
    const existingNames: [RegExp] = [
        new RegExp('user')
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule, FormsModule,
                MatFormFieldModule, MatInputModule, BrowserAnimationsModule
            ],
            declarations: [
                ExistingNameDirective,
                TestHostComponent
            ]
        });

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('form invalid when empty', () => {
        expect(component.form.valid).toBeFalsy();
    });

    it('name input field validity', () => {
        const name = component.form.controls.name;
        expect(name.valid).toBeFalsy();
    });

    it('should recognize the new name "Benjamin" and validate the form', () => {
        expect(component.dataMock).toEqual(existingNamesList);
        expect(component.form.valid).toBeFalsy();

        let i = 1;
        for (const user of existingNamesList) {
            existingNames[i] = new RegExp('(?:^|W)' + user.toLowerCase() + '(?:$|W)');

            i++;
        }

        expect(component.existingNames).toEqual(existingNames);

        fixture.detectChanges();

        const name = component.form.controls.name;

        let errors = {};
        errors = name.errors || {};
        expect(name.valid).toBeFalsy();

        // name field is required
        expect(errors['required']).toBeTruthy();
        expect(existingNamesValidator(existingNames));

        // set a new name
        name.setValue('Benjamin');
        fixture.detectChanges();

        errors = name.errors || {};

        expect(component.form.valid).toBeTruthy();
        expect(errors['required']).toBeFalsy();
        expect(existingNamesValidator(existingNames)).toBeTruthy();
        expect(component.form.controls.name.errors).toEqual(null);
    });

    it('should recognize the existing name "Ben" and invalid the form', () => {
        fixture.detectChanges();
        expect(component.dataMock).toEqual(existingNamesList);
        expect(component.form.valid).toBeFalsy();

        let i = 1;
        for (const user of existingNamesList) {
            existingNames[i] = new RegExp('(?:^|W)' + user.toLowerCase() + '(?:$|W)');

            i++;
        }

        expect(component.existingNames).toEqual(existingNames);

        let errors = {};
        const name = component.form.controls.name;
        expect(name.valid).toBeFalsy();

        // name field is required
        errors = name.errors || {};
        expect(errors['required']).toBeTruthy();
        expect(existingNamesValidator(existingNames));

        // set an existing name
        name.setValue('Ben');
        fixture.detectChanges();

        errors = name.errors || {};
        expect(component.form.valid).toBeFalsy();
        expect(errors['required']).toBeFalsy();
        expect(existingNamesValidator(existingNames)).toBeTruthy();
        expect(component.form.controls.name.errors.existingName.name).toEqual('ben');
    });

});
