import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, LoginResponse, LogoutResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '../../declarations/dsp-api-tokens';
import { NotificationService } from '../../services/notification.service';
import { Session, SessionService } from '../../services/session.service';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {

    /**
     * navigate to the defined url (or path) after successful login
     *
     * @param navigate
     */
    @Input() navigate?: string;

    /**
     * set your theme color here,
     * it will be used in the progress-indicator and the buttons
     *
     * @param color
     */
    @Input() color?: string;

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
    @Output() logoutSuccess: EventEmitter<boolean> = new EventEmitter<boolean>();

    // is there already a valid session?
    session: Session;

    // form
    form: FormGroup;

    // show progress indicator
    loading = false;

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
            server: 'An error has occurred when connecting to the server. Try again later or contact the DaSCH support.'
        }
    };

    // error definitions for the following form fields
    formErrors = {
        username: '',
        password: ''
    };

    // error messages for the form fields defined in formErrors
    validationMessages = {
        username: {
            required: 'user name is required.'
        },
        password: {
            required: 'password is required'
        }
    };


    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _sessionService: SessionService,
        private _fb: FormBuilder
    ) { }

    ngOnInit() {
        // if session is valid (a user is logged-in) show a message, otherwise build the form
        this._sessionService.isSessionValid().subscribe(
            result => {
                // returns a result if session is still valid
                if (result) {
                    this.session = JSON.parse(localStorage.getItem('session'));
                } else {
                    // session is invalid, build the login form
                    this.buildLoginForm();
                }
            }
        );
    }

    buildLoginForm(): void {
        this.form = this._fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    /**
     * @ignore
     *
     * Login and set session
     */
    login() {

        this.loading = true;
        this.isError = false;

        // grab values from form
        const identifier = this.form.get('username').value;
        const password = this.form.get('password').value;

        const identifierType: 'iri' | 'email' | 'username' = (identifier.indexOf('@') > -1 ? 'email' : 'username');

        this._dspApiConnection.v2.auth.login(identifierType, identifier, password).subscribe(
            (response: ApiResponseData<LoginResponse>) => {
                this._sessionService.setSession(response.body.token, identifier, identifierType).subscribe(
                    () => {
                        this.session = this._sessionService.getSession();
                        this.loginSuccess.emit(true);
                        this.loading = false;
                    }
                );
            },
            (error: ApiResponseError) => {
                // error handling
                this.loginFailed = (error.status === 401 || error.status === 404);
                this.loginErrorServer = (error.status === 0 || error.status >= 500 && error.status < 600);

                if (this.loginErrorServer) {
                    this._notification.openSnackBar(error);
                }

                this.loginSuccess.emit(false);
                this.isError = true;

                this.loading = false;
            }
        );
    }

    /**
     * @ignore
     *
     * Logout and destroy session
     *
     */
    logout() {
        this.loading = true;

        this._dspApiConnection.v2.auth.logout().subscribe(
            (response: ApiResponseData<LogoutResponse>) => {
                this.logoutSuccess.emit(true);
                this._sessionService.destroySession();
                this.loading = false;
                this.buildLoginForm();
                this.session = undefined;
                this.form.get('password').setValue('');
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
                this.logoutSuccess.emit(false);
                this.loading = false;
            }
        );

    }

}
