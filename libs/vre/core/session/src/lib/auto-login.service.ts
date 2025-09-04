import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, finalize, switchMap } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  hasCheckedCredentials$ = new BehaviorSubject(false);

  constructor(
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _userService: UserService,
    private _authService: AuthService,
    private _localizationsService: LocalizationService
  ) {}

  setup(): void {
    this._dspApiConnection.v2.jsonWebToken = ''; // needed for JS-LIB to run

    const encodedJWT = this._accessTokenService.getAccessToken();
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
            throw new AppError('Credentials not valid');
          }

          const userIri = decodedToken.sub;
          if (!userIri) {
            throw new AppError('Decoded user in JWT token is not valid.');
          }

          return this._userService.loadUser(userIri, 'iri').pipe(
            switchMap(user => {
              this._localizationsService.setLanguage(user.lang);
              return [user];
            })
          );
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
