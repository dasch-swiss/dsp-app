import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    AuthenticationEndpointV2,
    LoginResponse,
    LogoutResponse,
    MockUsers,
    UsersEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { TestConfig } from '@dsp-app/src/test.config';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '../../declarations/dsp-api-tokens';
import { DatadogRumService } from '../../services/datadog-rum.service';
import { Session, SessionService } from '../../services/session.service';
import { LoginFormComponent } from './login-form.component';

/**
 * test host component to simulate login-form component.
 */
@Component({
    template: ` <app-login-form
        #loginForm
        (loginSuccess)="onLogin($event)"
        (logoutSuccess)="onLogout($event)"
    ></app-login-form>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('loginForm') loginFormComponent: LoginFormComponent;

    loggedIn: boolean;

    ngOnInit() {}

    // if response is true, the login was successful
    // assign loggedIn to the response
    onLogin(response: boolean) {
        this.loggedIn = response;
    }

    // if response is true, the logout was successful
    // assign loggedIn to the opposite of the response
    onLogout(response: boolean) {
        this.loggedIn = !response;
    }
}

xdescribe('LoginFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        const authEndpointSpyObj = {
            admin: {
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', [
                    'getUser',
                ]),
            },
            v2: {
                auth: jasmine.createSpyObj('auth', ['login', 'logout']),
            },
        };

        const datadogRumServiceSpy = jasmine.createSpyObj('datadogRumService', [
            'setActiveUser',
        ]);

        TestBed.configureTestingModule({
            declarations: [LoginFormComponent, TestHostComponent],
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatInputModule,
                MatSnackBarModule,
                BrowserAnimationsModule,
                RouterTestingModule,
            ],
            providers: [
                AppInitService,
                DatadogRumService,
                SessionService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: authEndpointSpyObj,
                },
                {
                    provide: DatadogRumService,
                    useValue: datadogRumServiceSpy,
                },
            ],
        }).compileComponents();
    }));

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(sessionStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(sessionStorage, 'removeItem').and.callFake(
            (key: string): void => {
                delete store[key];
            }
        );
        spyOn(sessionStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(sessionStorage, 'clear').and.callFake(() => {
            store = {};
        });

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): void => {
                store[key] = value;
            }
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should create an instance', () => {
        expect(testHostComponent.loginFormComponent).toBeTruthy();
    });

    describe('Login', () => {
        beforeEach(() => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (
                dspConnSpy.v2.auth as jasmine.SpyObj<AuthenticationEndpointV2>
            ).login.and.callFake(() => {
                const response: LoginResponse = new LoginResponse();

                response.token = 'myToken';

                return of(
                    ApiResponseData.fromAjaxResponse({
                        response,
                    } as AjaxResponse)
                );
            });

            (
                dspConnSpy.admin
                    .usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
            ).getUser.and.callFake(() => {
                const loggedInUser = MockUsers.mockUser();
                return of(loggedInUser);
            });
        });

        it('should log the user in if the credentials are correct', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            testHostComponent.loginFormComponent.form
                .get('username')
                .setValue('root');

            testHostComponent.loginFormComponent.form
                .get('password')
                .setValue('test');

            testHostFixture.detectChanges();

            testHostComponent.loginFormComponent.login();

            expect(dspConnSpy.v2.auth.login).toHaveBeenCalledTimes(1);

            expect(dspConnSpy.v2.auth.login).toHaveBeenCalledWith(
                'username',
                'root',
                'test'
            );

            expect(
                dspConnSpy.admin.usersEndpoint.getUser
            ).toHaveBeenCalledTimes(1);

            expect(dspConnSpy.admin.usersEndpoint.getUser).toHaveBeenCalledWith(
                'username',
                'root'
            );

            const session = JSON.parse(localStorage.getItem('session'));

            expect(session.user.name).toEqual('root');

            expect(session.user.jwt).toEqual('myToken');

            expect(testHostComponent.loggedIn).toBeTruthy();
        });
    });

    describe('Logout', () => {
        beforeEach(() => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (
                dspConnSpy.v2.auth as jasmine.SpyObj<AuthenticationEndpointV2>
            ).logout.and.callFake(() => {
                const response: LogoutResponse = new LogoutResponse();

                response.status = 0;

                return of(
                    ApiResponseData.fromAjaxResponse({
                        response,
                    } as AjaxResponse)
                );
            });
        });

        it('should log the user out', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            // mock session directly instead of calling the login method
            const session: Session = {
                id: 12345,
                user: {
                    name: 'username',
                    jwt: 'myToken',
                    lang: 'en',
                    sysAdmin: false,
                    projectAdmin: [],
                },
            };

            // store session in localStorage
            localStorage.setItem('session', JSON.stringify(session));

            expect(
                JSON.parse(localStorage.getItem('session')).user.name
            ).toEqual('username');

            testHostComponent.loginFormComponent.logout();

            expect(dspConnSpy.v2.auth.logout).toHaveBeenCalledTimes(1);

            expect(JSON.parse(localStorage.getItem('session'))).toBeNull();

            expect(testHostComponent.loggedIn).toBeFalsy();
        });
    });
});
