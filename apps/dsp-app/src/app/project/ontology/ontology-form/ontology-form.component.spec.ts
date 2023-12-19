import { HttpClientTestingModule } from '@angular/common/http/testing';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection, MockProjects } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
  DspApiConfigToken,
  DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { MaterialModule } from '@dsp-app/src/app/material-module';
import { TestConfig } from '@dsp-app/src/test.config';
import { TranslateModule } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { OntologyFormComponent } from './ontology-form.component';

describe('OntologyFormComponent', () => {
  let ontologyFormComponent: OntologyFormComponent;
  let ontologyFormFixture: ComponentFixture<OntologyFormComponent>;

  const formBuilder: UntypedFormBuilder = new UntypedFormBuilder();

  const applicationStateServiceSpy = jasmine.createSpyObj(
    'ApplicationStateService',
    ['get']
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OntologyFormComponent],
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
        MaterialModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        // reference the new instance of formBuilder from above
        { provide: UntypedFormBuilder, useValue: formBuilder },
        AppConfigService,
        MockProvider(AppLoggingService),
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: new KnoraApiConnection(TestConfig.ApiConfig),
        },
        {
          provide: ApplicationStateService,
          useValue: applicationStateServiceSpy,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    // mock application state service for currentOntology
    const applicationStateServiceSpy = TestBed.inject(ApplicationStateService);

    (
      applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>
    ).get.and.callFake(() => {
      const response = MockProjects.mockProject();
      return of(response.body.project);
    });

    ontologyFormFixture = TestBed.createComponent(OntologyFormComponent);
    ontologyFormComponent = ontologyFormFixture.componentInstance;
    ontologyFormComponent.projectUuid = '0001';
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

  it('should test form validity with not allowed names', () => {
    const form = ontologyFormComponent.ontologyForm;
    expect(form.valid).toBeFalsy();

    const nameInput = form.controls.name;

    nameInput.setValue('v2onto');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('my-onto');
    expect(form.valid).toBeTruthy();

    nameInput.setValue('my_onto');
    expect(form.valid).toBeTruthy();

    nameInput.setValue('my.onto');
    expect(form.valid).toBeTruthy();

    nameInput.setValue('2ndOnto');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('-notAllowed');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('_notAllowed');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('no$or€');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('no spaces');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('ältereOnto');
    expect(form.valid).toBeFalsy();

    nameInput.setValue('bestOnto');
    expect(form.valid).toBeTruthy();
  });

  it('should test form validity without label', () => {
    const form = ontologyFormComponent.ontologyForm;
    expect(form.valid).toBeFalsy();

    const nameInput = form.controls.name;
    const labelInput = form.controls.label;

    nameInput.setValue('biblio');

    expect(ontologyFormComponent.ontologyForm.controls.label.value).toEqual(
      'Biblio'
    );
    expect(form.valid).toBeTruthy();

    labelInput.setValue('Biblio Ontology');
    expect(ontologyFormComponent.ontologyForm.controls.label.value).toEqual(
      'Biblio Ontology'
    );
    expect(form.valid).toBeTruthy();
  });
});
