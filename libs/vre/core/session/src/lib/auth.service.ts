import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { GrafanaFaroService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { finalize, switchMap, tap } from 'rxjs';
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
   * Complete authentication by loading user and setting language preferences.
   * Must not reload the page: auto-login calls this on every startup, so a reload here would loop.
   * Interactive login reloads in `login$` instead.
   * @param encodedJWT
   * @param identifierOrIri can be email, username, or user IRI
   * @param identifierType type of identifier: 'email', 'username', or 'iri'
   */
  afterSuccessfulLogin$(encodedJWT: string, identifierOrIri: string, identifierType: 'email' | 'username' | 'iri') {
    this._dspApiConnection.v2.jsonWebToken = encodedJWT;
    this._accessTokenService.storeToken(encodedJWT);

    return this._userService.loadUser(identifierOrIri, identifierType).pipe(
      tap(user => {
        const lang = LocalizationService.parseLanguage(user.lang);
        if (lang) {
          this._localizationsService.currentLanguage = lang;
        }
        this._grafanaFaroService.trackEvent('auth.login', {
          identifierType,
        });
        this._grafanaFaroService.setUser(user.id);
      })
    );
  }

  /**
   * Log in with credentials, then reload the page. The API silently omits resources, values and
   * properties the user may not see, and loaded data is not re-fetched on identity change, so a
   * reload is what makes the current view reflect the new permissions (DEV-7410).
   * Auto-login on startup calls `afterSuccessfulLogin$` directly, as reloading there would loop.
   */
  login$(identifierType: 'email' | 'username', identifier: string, password: string) {
    return this._dspApiConnection.v2.auth.login(identifierType, identifier, password).pipe(
      switchMap(response => this.afterSuccessfulLogin$(response.body.token, identifier, identifierType)),
      tap(() => this.reloadPage())
    );
  }

  /**
   * Cleanup authentication state with configurable options
   */
  afterLogout(): void {
    this._userService.logout();
    this._accessTokenService.removeToken();
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
          this.reloadPage();
        })
      )
      .subscribe();
  }

  /**
   * Reloads the page after login or logout. Extracted as a seam so tests can intercept it:
   * `window.location.reload()` cannot be mocked under jsdom >=26 (the `location`
   * object and its members are [LegacyUnforgeable]).
   */
  reloadPage(): void {
    window.location.reload();
  }
}
