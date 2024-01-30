import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { LoadUserAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, throwError } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  hasCheckedCredentials$ = new BehaviorSubject(false);

  constructor(
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store,
    private _authService: AuthService
  ) {}

  setup() {
    this._dspApiConnection.v2.jsonWebToken = ''; // needed for JS-LIB to run

    const encodedJWT = this._accessTokenService.getTokenUser();
    if (!encodedJWT) {
      this.hasCheckedCredentials$.next(true);
      return;
    }

    const decodedToken = this._accessTokenService.decodedAccessToken(encodedJWT);
    if (!decodedToken || this._accessTokenService.isValidToken(decodedToken)) {
      this.hasCheckedCredentials$.next(true);
      this._accessTokenService.removeTokens();
      return;
    }

    this._dspApiConnection.v2.jsonWebToken = encodedJWT;

    this._authService
      .isCredentialsValid$()
      .pipe(
        switchMap(isValid => {
          if (!isValid) {
            throwError('Credentials not valid');
          }

          const userIri = decodedToken.sub;
          if (!userIri) {
            return throwError('Decoded user in JWT token is not valid.');
          }

          return this._store.dispatch(new LoadUserAction(userIri, 'iri'));
        }),
        finalize(() => this.hasCheckedCredentials$.next(true))
      )
      .subscribe({
        error: () => {
          this._accessTokenService.removeTokens();
          this._dspApiConnection.v2.jsonWebToken = '';
        },
      });
  }
}
