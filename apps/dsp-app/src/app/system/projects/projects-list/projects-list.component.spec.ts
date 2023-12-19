import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { MockProvider } from 'ng-mocks';
import { ProjectsListComponent } from './projects-list.component';

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  beforeEach(waitForAsync(() => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['iriToUuid']);

    TestBed.configureTestingModule({
      declarations: [ProjectsListComponent, DialogComponent, StatusComponent],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatSnackBarModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
        MockProvider(AppLoggingService),
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

  // mock localStorage
  beforeEach(() => {
    let store = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string): string => store[key] || null);
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): string => (store[key] = <any>value));
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });
  });

  beforeEach(() => {
    localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect<any>(localStorage.getItem('session')).toBe(JSON.stringify(TestConfig.CurrentSession));
    expect(component).toBeTruthy();
  });
});
