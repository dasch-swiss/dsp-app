import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { BehaviorSubject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  hasCheckedCredentials$ = new BehaviorSubject(false);
  private _isInitialized = false;

  constructor(
    private readonly _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _authService: AuthService
  ) {}

  setup(): void {
    if (this._isInitialized) {
      console.warn('AutoLoginService.setup() has already been called. Ignoring duplicate call.');
      return;
    }
    this._isInitialized = true;

    if (!this._accessTokenService.tokenExists()) {
      this.hasCheckedCredentials$.next(true);
      return;
    }

    if (!this._accessTokenService.isValidToken()) {
      // Clear BOTH channels. `removeToken()` only empties localStorage, which `authInterceptorFn`
      // reads per request; dsp-js instead sends the in-memory copy on the shared `KnoraApiConfig`,
      // seeded at startup by `apiConnectionTokenProvider`. Leaving that copy set made dsp-js keep
      // sending `Authorization: Bearer <expired>` for the rest of the page lifetime while HttpClient
      // correctly sent nothing (DEV-7249). `afterLogout()` already clears both; this branch must too.
      this._accessTokenService.removeToken();
      this._dspApiConnection.v2.jsonWebToken = '';
      this.hasCheckedCredentials$.next(true);
      return;
    }

    const encodedJWT = this._accessTokenService.getAccessToken();
    const userIri = this._accessTokenService.getTokenUser();

    if (!encodedJWT || !userIri) {
      throw new AppError('Access token should exist.');
    }

    this._dspApiConnection.v2.jsonWebToken = encodedJWT;

    this.isCredentialsValid$()
      .pipe(
        switchMap(isValid => {
          if (!isValid) {
            throw new AppError('Credentials not valid');
          }

          return this._authService.afterSuccessfulLogin$(encodedJWT, userIri, 'iri');
        }),
        finalize(() => this.hasCheckedCredentials$.next(true))
      )
      .subscribe({
        error: () => {
          this._authService.logout();
        },
      });
  }

  private isCredentialsValid$() {
    return this._dspApiConnection.v2.auth.checkCredentials().pipe(
      map(() => true),
      catchError(() => {
        return of(false);
      })
    );
  }
}
