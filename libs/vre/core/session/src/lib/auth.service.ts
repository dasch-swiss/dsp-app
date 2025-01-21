import { Inject, Injectable } from '@angular/core';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, LoginResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserFeedbackError } from '@dasch-swiss/vre/core/error-handler';
import {
  ClearListsAction,
  ClearOntologiesAction,
  ClearOntologyClassAction,
  ClearProjectsAction,
  LoadUserAction,
  LogUserOutAction,
} from '@dasch-swiss/vre/core/state';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events as CommsEvents,
  LocalizationService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { AccessTokenService } from './access-token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private store: Store,
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _componentCommsService: ComponentCommunicationEventService,
    private _actions$: Actions,
    private _localizationsService: LocalizationService
  ) {}

  isCredentialsValid$() {
    return this._dspApiConnection.v2.auth.checkCredentials().pipe(
      take(1),
      map(response => {
        if (response instanceof ApiResponseError) {
          throwError(response);
        }
        return true;
      }),
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
        const encodedJWT = (response as ApiResponseData<LoginResponse>).body.token;
        this._accessTokenService.storeToken(encodedJWT);
        this._dspApiConnection.v2.jsonWebToken = encodedJWT;
        this._componentCommsService.emit(new EmitEvent(CommsEvents.loginSuccess));
      }),
      catchError(error => {
        if ((error instanceof ApiResponseError && error.status === 400) || error.status === 401) {
          return throwError(new UserFeedbackError('The username and / or password do not match.'));
        }
        return throwError(error);
      }),
      switchMap(() => {
        this._actions$.pipe(ofActionSuccessful(LoadUserAction), take(1)).subscribe(() => {
          this._localizationsService.setLanguage(this.store.selectSnapshot(state => state.user.user).lang);
        });
        return this.store.dispatch(new LoadUserAction(identifier, identifierType));
      })
    );
  }

  logout() {
    this._dspApiConnection.v2.auth
      .logout()
      .pipe(switchMap(() => this.clearState()))
      .subscribe(() => {
        this._accessTokenService.removeTokens();
        this._dspApiConnection.v2.jsonWebToken = '';
        window.location.reload();
      });
  }

  private clearState() {
    return this.store.dispatch([
      new LogUserOutAction(),
      new ClearProjectsAction(),
      new ClearListsAction(),
      new ClearOntologiesAction(),
      new ClearOntologyClassAction(),
    ]);
  }
}
