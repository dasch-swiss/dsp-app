import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProjects, MockUsers, ProjectsEndpointAdmin, StoredProject, UsersEndpointAdmin } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SortButtonComponent } from '../../main/action/sort-button/sort-button.component';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ProjectsComponent } from './projects.component';

/**
 * test component to simulate child component, here progress-indicator from action module.
 */
@Component({
  selector: 'app-progress-indicator',
  template: '',
})
class TestProgressIndicatorComponent {}

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  beforeEach(waitForAsync(() => {
    const dspConnSpy = {
      admin: {
        usersEndpoint: jasmine.createSpyObj('usersEndpoint', ['getUserByUsername']),
        projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjects']),
      },
    };

    const sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession', 'setSession']);

    TestBed.configureTestingModule({
      declarations: [
        ProjectsComponent,
        ProjectsListComponent,
        DialogComponent,
        StatusComponent,
        SortButtonComponent,
        TestProgressIndicatorComponent,
      ],
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
          provide: DspApiConnectionToken,
          useValue: dspConnSpy,
        },
        {
          provide: SessionService,
          useValue: sessionServiceSpy,
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
    const session = TestConfig.CurrentSession;
    session.user.sysAdmin = false;

    localStorage.setItem('session', JSON.stringify(session));

    expect<any>(localStorage.getItem('session')).toBe(JSON.stringify(TestConfig.CurrentSession));

    // mock getProjects response
    const dspConnSpy = TestBed.inject(DspApiConnectionToken);

    (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjects.and.callFake(() => {
      const projects = MockProjects.mockProjects();
      return of(projects);
    });

    (dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>).getUserByUsername.and.callFake(() => {
      const loggedInUser = MockUsers.mockUser();

      // recreate anything project
      const anythingProj = new StoredProject();
      anythingProj.id = 'http://rdfh.ch/projects/0001';
      anythingProj.longname = 'Anything Project';
      anythingProj.shortcode = '0001';
      anythingProj.keywords = ['arbitrary test data', 'things'];
      anythingProj.shortname = 'anything';
      anythingProj.status = true;

      // add project to list of users projects
      loggedInUser.body.user.projects = [anythingProj];
      return of(loggedInUser);
    });

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // todo: should get the list of projects (active and deactivated), should create/edit/deactivate a project
});
