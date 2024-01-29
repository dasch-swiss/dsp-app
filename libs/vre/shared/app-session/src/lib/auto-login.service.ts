import { Inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { LoadUserAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { fromEvent, throwError } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  constructor(
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store,
    private _authService: AuthService
  ) {}

  setup() {
    const encodedJWT = this._accessTokenService.getTokenUser();
    if (!encodedJWT) {
      return;
    }

    const decodedToken = this._accessTokenService.decodedAccessToken(encodedJWT);
    if (!decodedToken || this._accessTokenService.isValidToken(decodedToken)) {
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
        })
      )
      .subscribe({
        error: () => {
          this._accessTokenService.removeTokens();
          this._dspApiConnection.v2.jsonWebToken = '';
        },
      });
  }
}
