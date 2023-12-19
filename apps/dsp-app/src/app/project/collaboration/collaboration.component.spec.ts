import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { UsersListComponent } from '@dsp-app/src/app/system/users/users-list/users-list.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { TranslateModule } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { AddUserComponent } from './add-user/add-user.component';
import { CollaborationComponent } from './collaboration.component';
import { SelectGroupComponent } from './select-group/select-group.component';

/**
 * test component to simulate child component, here progress-indicator from action module.
 */
@Component({
  selector: 'app-progress-indicator',
  template: '',
})
class TestProgressIndicatorComponent {}

describe('CollaborationComponent', () => {
  let component: CollaborationComponent;
  let fixture: ComponentFixture<CollaborationComponent>;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  beforeEach(waitForAsync(() => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['uuidToIri']);

    TestBed.configureTestingModule({
      declarations: [
        CollaborationComponent,
        AddUserComponent,
        UsersListComponent,
        SelectGroupComponent,
        DialogComponent,
        StatusComponent,
        TestProgressIndicatorComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        MockProvider(AppLoggingService),
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              parent: {
                paramMap: of({
                  get: (param: string) => {
                    if (param === 'uuid') {
                      return TestConfig.ProjectUuid;
                    }
                  },
                }),
                snapshot: {
                  url: [],
                },
              },
            },
          },
        },
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
        {
          provide: ProjectService,
          useValue: projectServiceSpy,
        },
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: new KnoraApiConnection(TestConfig.ApiConfig),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

    fixture = TestBed.createComponent(CollaborationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect<any>(localStorage.getItem('session')).toBe(JSON.stringify(TestConfig.CurrentSession));
    expect(component).toBeTruthy();
  });

  // todo: check if the list is initialized, check the filter
  // check if the user is added and removed from the list, check if it is not possible to add a user that already exists in the list -> may be implemented in the add-user component
});
