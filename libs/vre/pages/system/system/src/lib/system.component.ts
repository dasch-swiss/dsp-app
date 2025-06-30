import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss'],
})
export class SystemComponent {
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);

  links = [
    { name: 'All Projects', url: RouteConstants.systemProjects, icon: 'assignment' },
    { name: 'All Users', url: RouteConstants.systemUsers, icon: 'group' },
  ];

  activeLink = '';

  constructor(
    private readonly _store: Store,
    private readonly _titleService: Title
  ) {
    this._titleService.setTitle('System administration');
  }
}
