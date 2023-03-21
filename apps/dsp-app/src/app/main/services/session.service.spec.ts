import { waitForAsync, TestBed } from '@angular/core/testing';
import {
    ApiResponseData,
    AuthenticationEndpointV2,
    CredentialsResponse,
    MockUsers,
    UsersEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { Session, SessionService } from './session.service';

describe('SessionService', () => {
    let service: SessionService;

    beforeEach(waitForAsync(() => {
        const dspConnSpy = {
            admin: {
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', [
                    'getUser',
                ]),
            },
            v2: {
                auth: jasmine.createSpyObj('auth', [
                    'checkCredentials',
                    'login',
                ]),
                jsonWebToken: '',
            },
        };

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy,
                },
            ],
        });
        service = TestBed.inject(SessionService);
    }));

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
            (key: string, value: string): void => {
                store[key] = value;
            }
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Method setSession', () => {
        it('should store user information in local storage without a jwt', (done) => {
            const dspSpy = TestBed.inject(DspApiConnectionToken);

            (
                dspSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
            ).getUser.and.callFake(() => {
                const loggedInUser = MockUsers.mockUser();
                return of(loggedInUser);
            });

            service.setSession(undefined, 'root', 'username').subscribe(() => {
                const ls: Session = JSON.parse(localStorage.getItem('session'));

                expect(dspSpy.v2.jsonWebToken).toEqual('');

                expect(ls.user.name).toEqual('root');
                expect(ls.user.jwt).toBeUndefined();
                expect(ls.user.lang).toEqual('de');
                expect(ls.user.sysAdmin).toEqual(false);
                expect(ls.user.projectAdmin.length).toEqual(0);

                expect(
                    dspSpy.admin.usersEndpoint.getUser
                ).toHaveBeenCalledTimes(1);
                expect(dspSpy.admin.usersEndpoint.getUser).toHaveBeenCalledWith(
                    'username',
                    'root'
                );

                expect(localStorage.setItem).toHaveBeenCalledTimes(1);

                done();
            });
        });

        it('should store user information in local storage with a jwt', (done) => {
            const dspSpy = TestBed.inject(DspApiConnectionToken);

            (
                dspSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
            ).getUser.and.callFake(() => {
                const loggedInUser = MockUsers.mockUser();
                return of(loggedInUser);
            });

            service.setSession('mytoken', 'root', 'username').subscribe(() => {
                const ls: Session = JSON.parse(localStorage.getItem('session'));

                expect(dspSpy.v2.jsonWebToken).toEqual('mytoken');

                expect(ls.user.name).toEqual('root');
                expect(ls.user.jwt).toEqual('mytoken');
                expect(ls.user.lang).toEqual('de');
                expect(ls.user.sysAdmin).toEqual(false);
                expect(ls.user.projectAdmin.length).toEqual(0);

                expect(
                    dspSpy.admin.usersEndpoint.getUser
                ).toHaveBeenCalledTimes(1);
                expect(dspSpy.admin.usersEndpoint.getUser).toHaveBeenCalledWith(
                    'username',
                    'root'
                );

                expect(localStorage.setItem).toHaveBeenCalledTimes(1);

                done();
            });
        });
    });

    describe('Method getSession', () => {
        it('should get the session with user information', () => {
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

            const ls: Session = service.getSession();
            expect(ls.id).toEqual(12345);
            expect(ls.user.name).toEqual('username');
            expect(ls.user.lang).toEqual('en');
            expect(ls.user.jwt).toEqual('myToken');
            expect(ls.user.sysAdmin).toEqual(false);
            expect(ls.user.projectAdmin.length).toEqual(0);

            expect(localStorage.getItem).toHaveBeenCalledTimes(1);
        });
    });

    describe('Method destroySession', () => {
        it('should destroy the session', () => {
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

            service.destroySession();
            const ls: Session = JSON.parse(localStorage.getItem('session'));
            expect(ls).toEqual(null);

            expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
        });
    });

    describe('Method isSessionValid', () => {
        it('should return false if there is no session', (done) => {
            const dspSpy = TestBed.inject(DspApiConnectionToken);

            service.isSessionValid().subscribe((isValid) => {
                expect(isValid).toBeFalsy();
                expect(dspSpy.v2.jsonWebToken).toEqual('');

                done();
            });
        });

        it('should return true if session is still valid', (done) => {
            // mocks Date.now() so every call will return this timestamp
            const baseTime = new Date(2020, 6, 7);
            jasmine.clock().mockDate(baseTime);

            // create a session with the mocked date to ensure the session is valid
            const session: Session = {
                id: Date.now() / 1000 - service.MAX_SESSION_TIME + 1, // still valid
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

            service.isSessionValid().subscribe((isValid) => {
                expect(isValid).toBeTruthy();

                done();
            });
        });

        it('should get credentials again if session has expired', (done) => {
            const dspSpy = TestBed.inject(DspApiConnectionToken);

            (
                dspSpy.v2.auth as jasmine.SpyObj<AuthenticationEndpointV2>
            ).checkCredentials.and.callFake(() => {
                const response: CredentialsResponse = new CredentialsResponse();

                response.message = 'credentials are OK';

                return of(
                    response as unknown as ApiResponseData<CredentialsResponse>
                );
            });

            const baseTime = new Date(2020, 6, 7);
            jasmine.clock().mockDate(baseTime);

            // create a session with an expired id
            const session: Session = {
                id: Date.now() / 1000 - service.MAX_SESSION_TIME, // expired
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

            service.isSessionValid().subscribe((isValid) => {
                expect(isValid).toBeFalsy();
                expect(dspSpy.v2.auth.checkCredentials).toHaveBeenCalledTimes(
                    1
                );

                done();
            });
        });
    });
});
