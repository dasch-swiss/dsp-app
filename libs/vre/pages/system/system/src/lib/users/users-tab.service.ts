import { ChangeDetectorRef, Injectable } from '@angular/core';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { BehaviorSubject, map, shareReplay, switchMap, tap } from 'rxjs';

@Injectable()
export class UsersTabService {
  isLoading = true;
  private _refreshSubject = new BehaviorSubject<null>(null);

  allUsers$ = this._refreshSubject.pipe(
    tap(() => {
      this.isLoading = true;
      this._cdr.detectChanges();
    }),
    switchMap(() => this._userApiService.list()),
    map(response => response.users),
    tap(() => {
      this.isLoading = false;
    }),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  constructor(
    private readonly _userApiService: UserApiService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  reloadUsers() {
    this._refreshSubject.next(null);
  }
}
