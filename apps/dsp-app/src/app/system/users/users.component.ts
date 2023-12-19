import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import {
  LoadUsersAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  @Select(UserSelectors.isLoading) isLoading$: Observable<boolean>;
  @Select(UserSelectors.activeUsers) active$: Observable<ReadUser[]>;
  // list of inactive (deleted) users
  @Select(UserSelectors.inactiveUsers) inactive$: Observable<ReadUser[]>;

  constructor(
    private _titleService: Title,
    private _store: Store
  ) {
    // set the page title
    this._titleService.setTitle('All users in DSP');
  }

  ngOnInit() {
    this._store.dispatch(new LoadUsersAction(true));
  }
}
