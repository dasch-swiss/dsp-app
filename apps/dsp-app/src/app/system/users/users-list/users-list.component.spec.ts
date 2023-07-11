import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    MockProjects,
    ProjectResponse,
    ProjectsEndpointAdmin,
    ReadProject,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { SelectGroupComponent } from '@dsp-app/src/app/project/collaboration/select-group/select-group.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { UsersListComponent } from './users-list.component';
import { Component } from '@angular/core';
import { AjaxResponse } from 'rxjs/ajax';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

@Component({
    template: '<app-users-list></app-users-list>',
})
class TestHostUsersListComponent {}

describe('UsersListComponent', () => {
    let component: TestHostUsersListComponent;
    let fixture: ComponentFixture<TestHostUsersListComponent>;

    beforeEach(waitForAsync(() => {
        const apiSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                    'getProjectByShortcode',
                ]),
            },
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', [
            'getSession',
            'setSession',
        ]);

        const applicationStateServiceSpy = jasmine.createSpyObj(
            'ApplicationStateService',
            ['get']
        );

        TestBed.configureTestingModule({
            declarations: [
                UsersListComponent,
                SelectGroupComponent,
                DialogComponent,
                StatusComponent,
                TestHostUsersListComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
            ],
            providers: [
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
                AppConfigService,
                MockProvider(AppLoggingService),
                {
                    provide: DspApiConnectionToken,
                    useValue: apiSpyObj,
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy,
                },
                {
                    provide: ApplicationStateService,
                    useValue: applicationStateServiceSpy,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        // mock application state service
        const applicationStateServiceSpy = TestBed.inject(
            ApplicationStateService
        );

        (
            applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>
        ).get.and.callFake(() => {
            const response: ProjectResponse = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(response.project as ReadProject);
        });

        // mock session service
        const sessionSpy = TestBed.inject(SessionService);

        (sessionSpy as jasmine.SpyObj<SessionService>).getSession.and.callFake(
            () => {
                const session: Session = {
                    id: 12345,
                    user: {
                        name: 'username',
                        jwt: 'myToken',
                        lang: 'en',
                        sysAdmin: true,
                        projectAdmin: [],
                    },
                };

                return session;
            }
        );

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjectByShortcode.and.callFake(() => {
            const response = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        fixture = TestBed.createComponent(TestHostUsersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
