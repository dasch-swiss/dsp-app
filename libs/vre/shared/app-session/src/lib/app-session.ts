import { Inject, Injectable } from '@angular/core';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    CredentialsResponse,
    KnoraApiConnection,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

/**
 * information about the current user
 */
interface CurrentUser {
    // username
    name: string;

    // json web token
    jwt?: string;

    // default language for ui
    lang: string;

    // is system admin?
    sysAdmin: boolean;

    // list of project shortcodes where the user is project admin
    projectAdmin: string[];
}

/**
 * session with id (= login timestamp) and inforamtion about logged-in user
 */
export interface Session {
    id: number;
    user: CurrentUser;
}

@Injectable({
    providedIn: 'root',
})
export class SessionService {
    /**
     * max session time in milliseconds
     * default value (24h = 24 * 60 * 60 * 1000): 86400000
     *
     */
    readonly MAX_SESSION_TIME: number = 3600;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection
    ) {}

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
    setSession(
        jwt: string,
        identifier: string,
        type: 'email' | 'username'
    ): Observable<void> {
        this._dspApiConnection.v2.jsonWebToken = jwt ? jwt : '';

        // get user information
        return this._dspApiConnection.admin.usersEndpoint
            .getUser(type, identifier)
            .pipe(
                map(
                    (
                        response:
                            | ApiResponseData<UserResponse>
                            | ApiResponseError
                    ) => {
                        this._storeSessionInLocalStorage(response, jwt);
                        // return type is void
                        return;
                    }
                )
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
                    map(
                        (
                            credentials:
                                | ApiResponseData<CredentialsResponse>
                                | ApiResponseError
                        ) => {
                            const idUpdated = this._updateSessionId(
                                credentials,
                                session,
                                tsNow
                            );
                            return idUpdated;
                        }
                    )
                );
            } else {
                // the internal session is still valid
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
    private _storeSessionInLocalStorage(
        response: ApiResponseData<UserResponse> | ApiResponseError,
        jwt: string
    ) {
        let session: Session;

        if (response instanceof ApiResponseData) {
            let sysAdmin = false;
            const projectAdmin: string[] = [];

            // get permission information: a) is user sysadmin? b) get list of project iri's where user is project admin
            const groupsPerProject =
                response.body.user.permissions.groupsPerProject;

            if (groupsPerProject) {
                const groupsPerProjectKeys: string[] =
                    Object.keys(groupsPerProject);

                for (const key of groupsPerProjectKeys) {
                    if (key === Constants.SystemProjectIRI) {
                        sysAdmin =
                            groupsPerProject[key].indexOf(
                                Constants.SystemAdminGroupIRI
                            ) > -1;
                    }

                    if (
                        groupsPerProject[key].indexOf(
                            Constants.ProjectAdminGroupIRI
                        ) > -1
                    ) {
                        projectAdmin.push(key);
                    }
                }
            }

            // store session information in browser's localstorage
            session = {
                id: this._setTimestamp(),
                user: {
                    name: response.body.user.username,
                    jwt: jwt,
                    lang: response.body.user.lang,
                    sysAdmin: sysAdmin,
                    projectAdmin: projectAdmin,
                },
            };

            // update localStorage
            localStorage.setItem('session', JSON.stringify(session));
        } else {
            localStorage.removeItem('session');
            // console.error(response);
        }
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
            return true;
        } else {
            // a user is not authenticated anymore!
            this.destroySession();
            return false;
        }
    }
}
