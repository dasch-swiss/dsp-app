import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection, MockProjects } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule
} from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { TestConfig } from 'test.config';
import { OntologyFormComponent } from './ontology-form.component';

describe('OntologyFormComponent', () => {
    let ontologyFormComponent: OntologyFormComponent;
    let ontologyFormFixture: ComponentFixture<OntologyFormComponent>;

    const formBuilder: FormBuilder = new FormBuilder();

    const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                OntologyFormComponent
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                DspCoreModule,
                HttpClientTestingModule,
                MatFormFieldModule,
                MatInputModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
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
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        // mock cache service for currentOntology
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response = MockProjects.mockProject();
                return of(response);
            }
        );

        ontologyFormFixture = TestBed.createComponent(OntologyFormComponent);
        ontologyFormComponent = ontologyFormFixture.componentInstance;
        ontologyFormComponent.projectCode = '00FF';
        // ontologyFormComponent.iri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
        ontologyFormComponent.existingOntologyNames = ['images'];

        ontologyFormComponent.ngOnInit();
        ontologyFormFixture.detectChanges();
    });


    it('should create', () => {
        expect(ontologyFormComponent).toBeTruthy();
    });

    it('should render input elements', () => {
        const compiled = ontologyFormFixture.debugElement;
        const nameInput = compiled.query(By.css('.ontology-name input'));
        const labelInput = compiled.query(By.css('.ontology-label input'));
        const commentInput = compiled.query(By.css('.ontology-comment textarea'));

        expect(nameInput).toBeTruthy();
        expect(labelInput).toBeTruthy();
        expect(commentInput).toBeTruthy();
    });

    it('should test form validity with allowed name', () => {
        const form = ontologyFormComponent.ontologyForm;
        expect(form.valid).toBeFalsy();

        const nameInput = form.controls.name;
        nameInput.setValue('biblio');

        expect(form.valid).toBeTruthy();
    });

    it('should test form validity with forbidden names', () => {
        const form = ontologyFormComponent.ontologyForm;
        expect(form.valid).toBeFalsy();

        const nameInput = form.controls.name;

        nameInput.setValue('ontology');
        expect(form.valid).toBeFalsy();

        nameInput.setValue('images');
        expect(form.valid).toBeFalsy();

    });

    it('should test form validity without label', () => {
        const form = ontologyFormComponent.ontologyForm;
        expect(form.valid).toBeFalsy();

        const nameInput = form.controls.name;
        const labelInput = form.controls.label;

        nameInput.setValue('biblio');

        const compiled = ontologyFormFixture.debugElement;
        expect(ontologyFormComponent.ontologyLabel).toEqual('Biblio');
        expect(form.valid).toBeTruthy();


        labelInput.setValue('Biblio Ontology');
        expect(ontologyFormComponent.ontologyForm.controls.label.value).toEqual('Biblio Ontology');
        expect(form.valid).toBeTruthy();

    });

});
