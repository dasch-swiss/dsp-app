import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserFeedbackError } from '@dasch-swiss/vre/core/error-handler';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events as CommsEvents,
  LocalizationService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private _userService: UserService,
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _componentCommsService: ComponentCommunicationEventService,
    private _localizationsService: LocalizationService
  ) {}

  isCredentialsValid$() {
    return this._dspApiConnection.v2.auth.checkCredentials().pipe(
      map(() => true),
      catchError(() => {
        return of(false);
      })
    );
  }

  /**
   * Login user
   * @param identifier can be the email or the username
   * @param password the password of the user
   */
  login$(identifier: string, password: string) {
    const identifierType = identifier.indexOf('@') > -1 ? 'email' : 'username';
    return this._dspApiConnection.v2.auth.login(identifierType, identifier, password).pipe(
      tap(response => {
        const encodedJWT = response.body.token;
        this._accessTokenService.storeToken(encodedJWT);
        this._dspApiConnection.v2.jsonWebToken = encodedJWT;
        this._componentCommsService.emit(new EmitEvent(CommsEvents.loginSuccess));
      }),
      catchError(error => {
        if ((error instanceof ApiResponseError && error.status === 400) || error.status === 401) {
          throw new UserFeedbackError('The username and / or password do not match.');
        }
        throw error;
      }),
      switchMap(() => {
        return this._userService.loadUser(identifier, identifierType).pipe(
          tap(user => {
            this._localizationsService.setLanguage(user.lang);
          })
        );
      })
    );
  }

  logout() {
    this._dspApiConnection.v2.auth.logout().subscribe(() => {
      this._userService.logout();
      this._accessTokenService.removeTokens();
      this._dspApiConnection.v2.jsonWebToken = '';
      window.location.reload();
    });
  }
}
