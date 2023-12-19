import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  KnoraApiConnection,
  MockOntology,
  ReadOntology,
  StringLiteral,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
  DspApiConfigToken,
  DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { TranslateModule } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { PropertyFormComponent } from '../property-form/property-form.component';
import { ResourceClassFormComponent } from './resource-class-form.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: '<app-resource-class-form></app-resource-class-form>',
})
class TestHostResourceClassFormComponent {}

@Component({ selector: 'dasch-swiss-app-string-literal', template: '' })
class MockStringLiteralInputComponent {
  @Input() placeholder = 'Label';
  @Input() textarea: boolean;
  @Input() value: StringLiteral[] = [];
  @Input() disabled: boolean;
  @Input() readonly: boolean;
}

describe('ResourceClassFormComponent', () => {
  let component: TestHostResourceClassFormComponent;
  let fixture: ComponentFixture<TestHostResourceClassFormComponent>;

  const applicationStateServiceSpy = jasmine.createSpyObj(
    'ApplicationStateService',
    ['get']
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestHostResourceClassFormComponent,
        MockStringLiteralInputComponent,
        ResourceClassFormComponent,
        PropertyFormComponent,
        DialogComponent,
        StatusComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatAutocompleteModule,
        MatDialogModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatOptionModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatTooltipModule,
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
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
      const response: ReadOntology = MockOntology.mockReadOntology(
        'http://0.0.0.0:3333/ontology/0001/anything/v2'
      );
      return of(response);
    });

    fixture = TestBed.createComponent(TestHostResourceClassFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
