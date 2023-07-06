import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
    UntypedFormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    MockUsers,
    UsersEndpointAdmin,
    UsersResponse,
} from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { PasswordFormComponent } from './password-form/password-form.component';
import { UserFormComponent } from './user-form.component';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

describe('UserFormComponent', () => {
    let component: UserFormComponent;
    let fixture: ComponentFixture<UserFormComponent>;
    const formBuilder: UntypedFormBuilder = new UntypedFormBuilder();

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    const applicationStateServiceSpyAllUsers = jasmine.createSpyObj(
        'ApplicationStateServiceAllUsers',
        ['get', 'set']
    );

    const apiSpyObj = {
        admin: {
            usersEndpoint: jasmine.createSpyObj('usersEndpoint', [
                'getUser',
                'getUsers',
            ]),
        },
    };

    const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
        'uuidToIri',
    ]);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                UserFormComponent,
                PasswordFormComponent,
                DialogComponent,
                StatusComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
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
                    useValue: apiSpyObj,
                },
                {
                    provide: ApplicationStateService,
                    useValue: applicationStateServiceSpyAllUsers,
                },
                {
                    provide: UntypedFormBuilder,
                    useValue: formBuilder,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        localStorage.setItem(
            'session',
            JSON.stringify(TestConfig.CurrentSession)
        );

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (
            dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
        ).getUsers.and.callFake(() => {
            const allUsers: ApiResponseData<UsersResponse> =
                MockUsers.mockUsers();
            return of(allUsers);
        });

        const cacheSpyAllUsers = TestBed.inject(ApplicationStateService);
        (
            cacheSpyAllUsers as jasmine.SpyObj<ApplicationStateService>
        ).get.and.callFake(() => {
            const allUsers: ApiResponseData<UsersResponse> =
                MockUsers.mockUsers();
            return of(allUsers.body.users);
        });

        fixture = TestBed.createComponent(UserFormComponent);
        component = fixture.componentInstance;
        component.userForm = formBuilder.group({
            givenName: ['', Validators.required],
            familyName: ['', Validators.required],
            email: ['', Validators.required],
            username: ['', Validators.required],
            password: ['', Validators.required],
            lang: ['en', Validators.required],
            status: ['', Validators.required],
            systemAdmin: ['', Validators.required],
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });

    // todo: should edit the user profile, check the submission and the validation of the form
});
