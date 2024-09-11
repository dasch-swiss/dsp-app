import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss'],
})
export class SystemComponent {
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;

  links = [
    { name: 'All Projects', url: RouteConstants.systemProjects, icon: 'assignment' },
    { name: 'All Users', url: RouteConstants.systemUsers, icon: 'group' },
  ];
  activeLink: string;

  constructor(private _titleService: Title) {
    this._titleService.setTitle('System administration');
  }
}
