import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatFormFieldModule, MatIconModule, MatInputModule, MatOptionModule, MatSelectModule, MatSlideToggleModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken } from '@knora/core';
import { AppInitService } from 'src/app/app-init.service';
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
                HttpClientTestingModule,
                MatAutocompleteModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatOptionModule,
                MatSelectModule,
                MatSlideToggleModule,
                ReactiveFormsModule
            ],
            providers: [
                // reference the new instance of formBuilder from above
                { provide: FormBuilder, useValue: formBuilder },
                AppInitService,
                {
                    provide: KnoraApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: KnoraApiConnectionToken,
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
