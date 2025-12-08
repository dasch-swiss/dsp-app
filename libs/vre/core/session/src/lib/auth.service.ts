import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { GrafanaFaroService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { finalize, tap } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly _userService: UserService,
    private readonly _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _grafanaFaroService: GrafanaFaroService,
    private readonly _localizationsService: LocalizationService
  ) {}

  /**
   * Complete authentication by loading user and setting language preferences
   * @param encodedJWT
   * @param identifierOrIri can be email, username, or user IRI
   * @param identifierType type of identifier: 'email', 'username', or 'iri'
   */
  afterSuccessfulLogin$(encodedJWT: string, identifierOrIri: string, identifierType: 'email' | 'username' | 'iri') {
    this._dspApiConnection.v2.jsonWebToken = encodedJWT;
    this._accessTokenService.storeToken(encodedJWT);

    return this._userService.loadUser(identifierOrIri, identifierType).pipe(
      tap(user => {
        this._localizationsService.setLanguage(user.lang);
        this._grafanaFaroService.trackEvent('auth.login', {
          identifierType,
        });
        this._grafanaFaroService.setUser(user.id);
      })
    );
  }

  /**
   * Cleanup authentication state with configurable options
   */
  afterLogout(): void {
    this._userService.logout();
    this._accessTokenService.removeTokens();
    this._dspApiConnection.v2.jsonWebToken = '';
    this._grafanaFaroService.trackEvent('auth.logout');
    this._grafanaFaroService.removeUser();
  }

  /**
   * Logout user - performs API logout and full cleanup
   */
  logout() {
    this._dspApiConnection.v2.auth
      .logout()
      .pipe(
        finalize(() => {
          this.afterLogout();
          window.location.reload();
        })
      )
      .subscribe();
  }
}
