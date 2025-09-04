import { Injectable } from '@angular/core';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, catchError, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _user$ = new BehaviorSubject<ReadUser | null>(null);

  // Public observables
  user$ = this._user$.asObservable();
  isLoggedIn$ = this._user$.pipe(map(user => user !== null));
  isSysAdmin$ = this._user$.pipe(map(user => (user ? UserPermissions.hasSysAdminRights(user) : false)));
  userActiveProjects$ = this._user$.pipe(map(user => (user ? user.projects.filter(project => project.status) : [])));
  userInactiveProjects$ = this._user$.pipe(map(user => (user ? user.projects.filter(project => !project.status) : [])));

  constructor(private _userApiService: UserApiService) {}

  get currentUser(): ReadUser | null {
    return this._user$.value;
  }

  loadUser(identifier: string, idType: 'iri' | 'email' | 'username'): Observable<ReadUser> {
    return this._userApiService.get(identifier, idType).pipe(
      catchError(error => {
        this.logout();
        throw new AppError(`User could not be loaded: ${idType}: ${identifier}: ${JSON.stringify(error)}`);
      }),
      tap(response => {
        this._user$.next(response.user);
      }),
      map(response => response.user)
    );
  }

  reloadUser(): Observable<ReadUser> {
    const currentUser = this.currentUser;
    if (!currentUser) {
      throw new AppError('No user is currently logged in.');
    }
    return this.loadUser(currentUser.id, 'iri');
  }

  logout(): void {
    this._user$.next(null);
  }
}
