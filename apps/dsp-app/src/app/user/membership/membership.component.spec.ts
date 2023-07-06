import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    MockProjects,
    MockUsers,
    ProjectsEndpointAdmin,
    UsersEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { MembershipComponent } from './membership.component';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

describe('MembershipComponent', () => {
    let component: MembershipComponent;
    let fixture: ComponentFixture<MembershipComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    beforeEach(waitForAsync(() => {
        const adminEndpointSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                    'getProjects',
                    'getProjectMembersByIri',
                ]),
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', [
                    'getUserByUsername',
                    'addUserToProjectMembership',
                    'removeUserFromProjectMembership',
                ]),
            },
        };

        const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
            'iriToUuid',
        ]);

        TestBed.configureTestingModule({
            declarations: [
                MembershipComponent,
                DialogComponent,
                StatusComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatDividerModule,
                MatIconModule,
                MatListModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule,
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
                    provide: DspApiConnectionToken,
                    useValue: adminEndpointSpyObj,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
        ).getUserByUsername.and.callFake(() => {
            const loggedInUser = MockUsers.mockUser();
            return of(loggedInUser);
        });

        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjects.and.callFake(() => {
            const projects = MockProjects.mockProjects();
            return of(projects);
        });

        fixture = TestBed.createComponent(MembershipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
