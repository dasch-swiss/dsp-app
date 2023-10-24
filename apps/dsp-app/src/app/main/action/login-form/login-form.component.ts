import {
    AfterViewInit,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    LoginResponse,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import {DspApiConnectionToken, RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { AuthenticationService } from '../../services/authentication.service';
import {
    ComponentCommunicationEventService,
    EmitEvent,
    Events,
} from '../../services/component-communication-event.service';
import {
    DatadogRumService,
    PendoAnalyticsService,
} from '@dasch-swiss/vre/shared/app-analytics';
import { Location } from '@angular/common';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { v5 as uuidv5 } from 'uuid';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit, AfterViewInit {
    /**
     * set whether or not you want icons to display in the input fields
     *
     * @param icons
     */
    @Input() icons?: boolean;

    /**
     * emits true when the login process was successful and false in case of error
     *
     * @param loginSuccess
     *
     */
    @Output() loginSuccess: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * emits true when the logout process was successful and false in case of error
     *
     * @param logoutSuccess
     *
     */
    @Output() logoutSuccess: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    // @ViewChild('username') usernameInput: ElementRef;

    // is there already a valid session?
    session: Session;

    // form
    form: UntypedFormGroup;

    // show progress indicator
    loading = false;

    // url history
    returnUrl: string;

    // in case of an error
    isError: boolean;

    // specific error messages
    loginFailed = false;
    loginErrorServer = false;

    // labels for the login form
    // todo: should be handled by translation service (i18n)
    formLabel = {
        title: 'Login here',
        name: 'Username',
        pw: 'Password',
        submit: 'Login',
        retry: 'Retry',
        logout: 'LOGOUT',
        remember: 'Remember me',
        forgotPassword: 'Forgot password?',
        error: {
            failed: 'Password or username is wrong',
            server: 'An error has occurred when connecting to the server. Try again later or contact the DaSCH support.',
        },
    };

    // error definitions for the following form fields
    formErrors = {
        username: '',
        password: '',
    };

    // error messages for the form fields defined in formErrors
    validationMessages = {
        username: {
            required: 'user name is required.',
        },
        password: {
            required: 'password is required',
        },
    };

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _auth: AuthenticationService,
        private _componentCommsService: ComponentCommunicationEventService,
        private _datadogRumService: DatadogRumService,
        private _pendoAnalytics: PendoAnalyticsService,
        private _errorHandler: AppErrorHandler,
        private _fb: UntypedFormBuilder,
        private _session: SessionService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _location: Location,
        private _projectService: ProjectService
    ) {
        this.returnUrl = this._route.snapshot.queryParams['returnUrl'];
    }

    ngOnInit() {
        // if session is valid (a user is logged-in) show a message, otherwise build the form
        this._session.isSessionValid().subscribe((result) => {
            // returns a result if session is still valid
            if (result) {
                this.session = JSON.parse(localStorage.getItem('session'));
            } else {
                // session is invalid, build the login form
                this.buildLoginForm();
            }
        });
    }

    ngAfterViewInit() {
        if (this.session) {
            // this.usernameInput.nativeElement.focus();
        }
    }

    buildLoginForm(): void {
        this.form = this._fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    /**
     *
     * login and set session
     */
    login() {
        this.loading = true;
        this.isError = false;

        // grab values from form
        const identifier: string = this.form.get('username').value;
        const password: string = this.form.get('password').value;

        const identifierType: 'iri' | 'email' | 'username' =
            identifier.indexOf('@') > -1 ? 'email' : 'username';

        // FIXME: remove authentication business logic from component into authentication service
        this._dspApiConnection.v2.auth
            .login(identifierType, identifier, password)
            .subscribe(
                (response: ApiResponseData<LoginResponse>) => {
                    this._session
                        .setSession(
                            response.body.token,
                            identifier,
                            identifierType
                        )
                        .subscribe(() => {
                            this.loginSuccess.emit(true);
                            this.session = this._session.getSession();

                            this._componentCommsService.emit(
                                new EmitEvent(Events.loginSuccess, true)
                            );
                            // if user hit a page that requires to be logged in, they will have a returnUrl in the url
                            this.returnUrl =
                                this._route.snapshot.queryParams['returnUrl'];
                            if (this.returnUrl) {
                                this._router.navigate([this.returnUrl]);
                            } else if (
                                !this._location.path() ||
                                (this._route.snapshot.url.length &&
                                    this._route.snapshot.url[0].path ===
                                        RouteConstants.login)
                            ) {
                                // if user is on "/" or "/login"
                                const username = this.session.user.name;
                                this._dspApiConnection.admin.usersEndpoint
                                    .getUserByUsername(username)
                                    .subscribe(
                                        (
                                            userResponse: ApiResponseData<UserResponse>
                                        ) => {
                                            const uuid =
                                                this._projectService.iriToUuid(
                                                    userResponse.body.user
                                                        .projects[0]?.id
                                                );
                                            // if user is NOT a sysAdmin and only a member of one project, redirect them to that projects dashboard
                                            if (
                                                !this.session.user.sysAdmin &&
                                                userResponse.body.user.projects
                                                    .length === 1
                                            ) {
                                                this._router
                                                    .navigateByUrl(`/${RouteConstants.refresh}`, {
                                                        skipLocationChange:
                                                            true,
                                                    })
                                                    .then(() =>
                                                        this._router.navigate([
                                                            RouteConstants.project, uuid
                                                        ])
                                                    );
                                            } else {
                                                // if user is a sysAdmin or a member of multiple projects, redirect them to the overview
                                                this._router
                                                    .navigateByUrl(`/${RouteConstants.refresh}`, {
                                                        skipLocationChange:
                                                            true,
                                                    })
                                                    .then(() =>
                                                        this._router.navigate([
                                                            RouteConstants.home,
                                                        ])
                                                    );
                                            }
                                        }
                                    );
                            } else {
                                window.location.reload();
                            }
                            const uuid: string = uuidv5(identifier, uuidv5.URL);
                            this._datadogRumService.setActiveUser(uuid);
                            this._pendoAnalytics.setActiveUser(uuid);
                            this.loading = false;
                        });
                },
                (error: ApiResponseError) => {
                    // error handling
                    this.loginFailed =
                        error.status === 401 || error.status === 404;
                    this.loginErrorServer =
                        error.status === 0 ||
                        (error.status >= 500 && error.status < 600);

                    if (this.loginErrorServer) {
                        this._errorHandler.showMessage(error);
                    }

                    this.isError = true;

                    this.loading = false;
                }
            );
    }

    logout() {
        // bring back the logout method and use it in the parent (somehow)
        this._auth.logout();
    }
}
