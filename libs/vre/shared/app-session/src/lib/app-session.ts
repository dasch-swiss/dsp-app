import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ApiResponseData, ApiResponseError, Constants, CredentialsResponse, UserResponse } from '@dasch-swiss/dsp-js';

import { UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { Observable, of } from 'rxjs';
import { catchError, map, takeLast } from 'rxjs/operators';
import { Session } from './session';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private _applicationStateService = inject(ApplicationStateService);
  private _dspApiConnection = inject(DspApiConnectionToken);

  session = signal<Session | undefined>(undefined);
  session$ = toObservable(this.session);

  /**
   * max session time in milliseconds
   * default value (24h = 24 * 60 * 60 * 1000): 86400000
   *
   */
  readonly MAX_SESSION_TIME: number = 3600;

  constructor(private _userApiService: UserApiService) {
    // check if the (possibly) existing session is still valid and if not, destroy it
    this.isSessionValid()
      .pipe(takeLast(1))
      .subscribe(valid => {
        if (!valid) {
          this.destroySession();
        }
      });

    if (this.session()) {
      /**
       * set the application state for current/logged-in user
       */
      const session = this.session() as Session;
      this._userApiService.get(session.user.name as string, 'username').subscribe(response => {
        if (response instanceof ApiResponseData) {
          this._applicationStateService.set(session.user.name, response.body.user);
        }
      });
    }
  }

  /**
   * get session information from localstorage
   */
  getSession(): Session | null {
    const sessionData = localStorage.getItem('session');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  /**
   * set session by using the json web token (jwt) and the user object;
   * it will be used in the login process
   *
   * @param jwt Json Web Token
   * @param identifier  email address or username
   * @param type 'email' or 'username'
   */
  setSession(jwt: string, identifier: string, type: 'email' | 'username'): Observable<boolean> {
    this._dspApiConnection.v2.jsonWebToken = jwt ? jwt : '';

    // get user information
    return this._userApiService.get(identifier, type).pipe(
      map(response => {
        this._storeSessionInLocalStorage(response, jwt);
        // return type is void
        return true;
      })
    );
  }

  /**
   * validate intern session and check knora api credentials if necessary.
   * If a json web token exists, it doesn't mean that the knora api credentials are still valid.
   *
   */
  isSessionValid(): Observable<boolean> {
    // mix of checks with session.validation and this.authenticate
    const sessionData = localStorage.getItem('session');

    if (sessionData) {
      const session = JSON.parse(sessionData);
      const tsNow: number = this._setTimestamp();
      this._dspApiConnection.v2.jsonWebToken = session.user.jwt;

      // check if the session is still valid:
      if (session.id + this.MAX_SESSION_TIME <= tsNow) {
        // the internal session has expired
        // check if the api credentials are still valid

        return this._dspApiConnection.v2.auth.checkCredentials().pipe(
          map((credentials: ApiResponseData<CredentialsResponse> | ApiResponseError) => {
            return this._updateSessionId(credentials, session, tsNow);
          }),
          catchError(() => {
            // if there is any error checking the credentials (mostly a 401 for after
            // switching the server where this session/the credentials are unknown), we destroy the session
            // so a new login is required
            this.destroySession();
            return of(false);
          })
        );
      } else {
        // the internal session is still valid
        this.session.set(session);
        return of(true);
      }
    } else {
      // no session found; update knora api connection with empty jwt
      this._dspApiConnection.v2.jsonWebToken = '';
      return of(false);
    }
  }

  /**
   * destroy session by removing the session from local storage
   *
   */
  destroySession() {
    localStorage.removeItem('session');
    this.session.set(undefined);
  }

  /**
   * returns a timestamp represented in seconds
   *
   */
  private _setTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * store session in local storage
   * @param response response from getUser method call
   * @param jwt JSON web token string
   */
  private _storeSessionInLocalStorage(response: UserResponse, jwt: string) {
    let sysAdmin = false;
    const projectAdmin: string[] = [];

    // get permission information: a) is user sysadmin? b) get list of project iri's where user is project admin
    const groupsPerProject = response.user.permissions.groupsPerProject;

    if (groupsPerProject) {
      const groupsPerProjectKeys: string[] = Object.keys(groupsPerProject);

      for (const key of groupsPerProjectKeys) {
        if (key === Constants.SystemProjectIRI) {
          sysAdmin = groupsPerProject[key].indexOf(Constants.SystemAdminGroupIRI) > -1;
        }

        if (groupsPerProject[key].indexOf(Constants.ProjectAdminGroupIRI) > -1) {
          projectAdmin.push(key);
        }
      }
    }

    // store session information in browser's localstorage
    const session = {
      id: this._setTimestamp(),
      user: {
        name: response.user.username,
        jwt: jwt,
        lang: response.user.lang,
        sysAdmin: sysAdmin,
        projectAdmin: projectAdmin,
      },
    };

    // update localStorage
    localStorage.setItem('session', JSON.stringify(session));
    this.session.set(session);
  }

  /**
   * updates the id of the current session in the local storage
   * @param credentials response from getCredentials method call
   * @param session the current session
   * @param timestamp timestamp in form of a number
   */
  private _updateSessionId(
    credentials: ApiResponseData<CredentialsResponse> | ApiResponseError,
    session: Session,
    timestamp: number
  ): boolean {
    if (credentials instanceof ApiResponseData) {
      // the dsp api credentials are still valid
      // update the session.id
      session.id = timestamp;
      localStorage.setItem('session', JSON.stringify(session));
      this.session.set(session);
      return true;
    } else {
      // a user is not authenticated anymore!
      this.destroySession();
      return false;
    }
  }
}
