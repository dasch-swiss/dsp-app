import { Component, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    ClassDefinition,
    GroupsEndpointAdmin,
    GroupsResponse,
    MembersResponse,
    MockOntology,
    MockProjects,
    MockUsers,
    OntologiesEndpointV2,
    ProjectResponse,
    ProjectsEndpointAdmin,
    ReadGroup,
    ReadOntology,
    ReadProject,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '../main/dialog/dialog.component';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { StatusComponent } from '../main/status/status.component';
import { OntologyService } from './ontology/ontology.service';
import { ProjectComponent } from './project.component';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

@Component({
    selector: 'app-ontology-classes',
})
class MockOntologyClassesComponent {
    @Input() resClasses: ClassDefinition[];
    @Input() projectMember: boolean;
}

@Component({
    selector: 'dasch-swiss-app-progress-indicator',
    template: '',
})
class MockProgressIndicatorComponent {}

@Component({
    template: '<app-project #project></app-project>',
})
class TestHostProjectComponent {
    @ViewChild('project') projectComp: ProjectComponent;
}

describe('ProjectComponent', () => {
    let component: TestHostProjectComponent;
    let fixture: ComponentFixture<TestHostProjectComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    beforeEach(waitForAsync(() => {
        const applicationStateServiceSpy = jasmine.createSpyObj(
            'ApplicationStateService',
            ['get', 'set', 'has']
        );

        // getProjectMembersByIri and getGroups currently have no mock implementation because
        // their results are stored in the application state but never actually used in the component
        // so they're irrevelant for this unit test but need to be defined at least
        const dspConnSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                    'getProjectByIri',
                    'getProjectMembersByIri',
                ]),
                groupsEndpoint: jasmine.createSpyObj('groupsEndpoint', [
                    'getGroups',
                ]),
            },
            v2: {
                onto: jasmine.createSpyObj('onto', [
                    'getOntologiesByProjectIri',
                    'getOntology',
                ]),
            },
        };
        const ontoServiceSpy = jasmine.createSpyObj('OntologyService', [
            'getOntologyName',
        ]);

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', [
            'getSession',
            'setSession',
        ]);

        TestBed.configureTestingModule({
            declarations: [
                TestHostProjectComponent,
                ProjectComponent,
                DialogComponent,
                StatusComponent,
                MockOntologyClassesComponent,
                MockProgressIndicatorComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatDividerModule,
                MatExpansionModule,
                MatIconModule,
                MatListModule,
                MatSidenavModule,
                MatSnackBarModule,
                MatTabsModule,
                MatTooltipModule,
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
                    useValue: dspConnSpyObj,
                },
                {
                    provide: ApplicationStateService,
                    useValue: applicationStateServiceSpy,
                },
                {
                    provide: OntologyService,
                    useValue: ontoServiceSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            url: [{ path: 'project' }],
                            params: [{ uuid: '00123001' }],
                        },
                    },
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy,
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

        // mock API
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        // mock projects endpoint
        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjectByIri.and.callFake(() => {
            const response = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        // mock project members endpoint
        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjectMembersByIri.and.callFake(() => {
            const response = new MembersResponse();

            const mockUsers = MockUsers.mockUsers();

            response.members = mockUsers.body.users;

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        // mock groups endpoint
        (
            dspConnSpy.admin
                .groupsEndpoint as jasmine.SpyObj<GroupsEndpointAdmin>
        ).getGroups.and.callFake(() => {
            const response = new GroupsResponse();

            const groups = [new ReadGroup()];

            response.groups = groups;

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        (
            dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>
        ).getOntologiesByProjectIri.and.callFake(() => {
            const anythingOnto = MockOntology.mockOntologiesMetadata();
            return of(anythingOnto);
        });

        (
            dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>
        ).getOntology.and.callFake(() => {
            const response: ReadOntology = MockOntology.mockReadOntology(
                'http://0.0.0.0:3333/ontology/0001/anything/v2'
            );
            return of(response);
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

        fixture = TestBed.createComponent(TestHostProjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check title, check if we get the shortcode of the current project and valide it, check if get session, get project by shortcode, check if the user is logged in as
    // system admin or project admin
});
