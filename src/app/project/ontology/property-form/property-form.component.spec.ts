import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService, DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { TestConfig } from 'test.config';
import { PropertyFormComponent } from './property-form.component';

xdescribe('PropertyFormComponent', () => {
    let component: PropertyFormComponent;
    let fixture: ComponentFixture<PropertyFormComponent>;

    const formBuilder: FormBuilder = new FormBuilder();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PropertyFormComponent],
            imports: [
                BrowserAnimationsModule,
                CommonModule,
                HttpClientTestingModule,
                MatAutocompleteModule,
                MatDialogModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatOptionModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatSnackBarModule,
                ReactiveFormsModule
            ],
            providers: [
                // reference the new instance of formBuilder from above
                { provide: FormBuilder, useValue: formBuilder },
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PropertyFormComponent);
        component = fixture.componentInstance;

        // pass in the form dynamically
        component.propertyForm = formBuilder.group({
            type: null,
            label: null,
            multiple: null,
            required: null,
            permission: null
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
