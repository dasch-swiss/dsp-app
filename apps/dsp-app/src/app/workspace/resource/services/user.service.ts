import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, UserCache, UserResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // instance of user cache
  private _userCache: UserCache;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {
    // instantiate user cache
    this._userCache = new UserCache(this._dspApiConnection);
  }

  /**
   * retrieves information about the specified user.
   *
   * @param userIri the Iri identifying the user.
   */
  getUser(userIri: string): Observable<UserResponse> {
    return this._userCache.getUser(userIri);
  }
}
