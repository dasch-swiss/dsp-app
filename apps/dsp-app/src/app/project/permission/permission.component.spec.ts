import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
    KnoraApiConnection,
    MockProjects,
    ProjectResponse,
    ReadProject,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { GroupsListComponent } from '@dsp-app/src/app/system/groups/groups-list/groups-list.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { AddGroupComponent } from './add-group/add-group.component';
import { PermissionComponent } from './permission.component';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

/**
 * mocked linkify pipe from main/pipes.
 */
@Pipe({ name: 'appLinkify' })
class MockPipe implements PipeTransform {
    transform(value: string): string {
        // do stuff here, if you want
        return value;
    }
}

describe('PermissionComponent', () => {
    let component: PermissionComponent;
    let fixture: ComponentFixture<PermissionComponent>;

    beforeEach(waitForAsync(() => {
        const applicationStateServiceSpy = jasmine.createSpyObj(
            'ApplicationStateService',
            ['get', 'set']
        );

        TestBed.configureTestingModule({
            declarations: [
                PermissionComponent,
                AddGroupComponent,
                GroupsListComponent,
                DialogComponent,
                StatusComponent,
                MockPipe,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                HttpClientTestingModule,
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
    });

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem(
            'session',
            JSON.stringify(TestConfig.CurrentSession)
        );

        fixture = TestBed.createComponent(PermissionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });
});
