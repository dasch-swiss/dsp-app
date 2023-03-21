import { Inject, Injectable } from '@angular/core';
import {
    KnoraApiConnection,
    UserCache,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';

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
