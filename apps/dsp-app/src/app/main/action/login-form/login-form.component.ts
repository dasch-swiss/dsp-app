import { DOCUMENT, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthError, AuthService } from '@dasch-swiss/vre/shared/app-session';
import { LoadUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { take, takeLast } from 'rxjs/operators';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events,
} from '../../services/component-communication-event.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit, OnDestroy {
  get isLoggedIn$(): Observable<boolean> {
    return this._authService.isSessionValid$();
  }
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
  // form
  form: UntypedFormGroup;
  // show progress indicator
  loading = false;
  // in case of an error
  isError: boolean;
  // specific error messages
  loginFailed = false;
  loginErrorServer = false;
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

  // labels for the login form
  // error messages for the form fields defined in formErrors
  validationMessages = {
    username: {
      required: 'user name is required.',
    },
    password: {
      required: 'password is required',
    },
  };
  returnUrl: string;
  private readonly returnUrlParameterName = 'returnUrl';
  private destroyed$ = new Subject<void>();

  constructor(
    private _componentCommsService: ComponentCommunicationEventService,
    private _fb: UntypedFormBuilder,
    private router: Router,
    private _authService: AuthService,
    private route: ActivatedRoute,
    private location: Location,
    private cd: ChangeDetectorRef,
    private _actions$: Actions,
    private _store: Store,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * The login form is currently only shown from the user-menu.component.ts.
   * The use case of showing the login form when the user is redirected
   * to /login?returnUrl=... was removed.
   */
  ngOnInit() {
    this.buildLoginForm();
    this.returnUrl = this.getReturnUrl();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  buildLoginForm(): void {
    this.form = this._fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /**
   * login
   */
  login() {
    this.loading = true;
    this.isError = false;

    // grab values from form
    const identifier: string = this.form.get('username').value;
    const password: string = this.form.get('password').value;

    this._authService
      .apiLogin$(identifier, password)
      .pipe(takeLast(1))
      .subscribe({
        next: loginResult => {
          if (loginResult) {
            this._componentCommsService.emit(new EmitEvent(Events.loginSuccess, true));
            this._store.dispatch(new LoadUserAction(identifier));
            return combineLatest([
              this._actions$.pipe(ofActionSuccessful(LoadUserAction)),
              this._store.select(UserSelectors.user),
            ])
              .pipe(take(1))
              .subscribe(([action, user]) => {
                this.loading = false;
                this._authService.loginSuccessfulEvent.emit(user);
                this.cd.markForCheck();
                if (this.returnUrl) {
                  this.router.navigate([this.returnUrl]);
                }
              });
          }
        },
        error: (error: AuthError) => {
          this.loginSuccess.emit(false);

          this._componentCommsService.emit(new EmitEvent(Events.loginSuccess, false));

          this.loading = false;
          this.isError = true;

          if (error.status === 401) {
            this.loginFailed = true;
          } else {
            this.loginErrorServer = true;
          }
        },
      });
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParams[this.returnUrlParameterName];
    this.location.go(this.removeParameterFromUrl(this.location.path(), this.returnUrlParameterName, returnUrl));
    return returnUrl;
  }

  private removeParameterFromUrl(path: string, parameterName: string, parameterValue: string): string {
    const urlSegments = path.split('?');
    const queryString = urlSegments.pop();
    if (!queryString) {
      return path;
    }
    const params = queryString.split('&');
    const newQuerystring = params
      .filter(item => item !== `${parameterName}=${encodeURIComponent(parameterValue)}`)
      .join('&');

    if (newQuerystring) {
      urlSegments.push(newQuerystring);
    }

    return urlSegments.join('?');
  }
}
