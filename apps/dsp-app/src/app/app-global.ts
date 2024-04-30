import { StringLiteral } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';

import { MenuItem } from './main/declarations/menu-item';

export class AppGlobal {
  // user navigation
  public static userNav: MenuItem[] = [
    {
      label: 'My Projects',
      shortLabel: 'Projects',
      route: RouteConstants.projectsRelative,
      icon: 'assignment',
    },
    {
      label: 'My Account',
      shortLabel: 'Account',
      route: RouteConstants.userAccountRelative,
      icon: 'settings',
    },
  ];

  // possible languages, will be used in form and to change the gui language
  public static languagesList: StringLiteral[] = [
    {
      language: 'en',
      value: 'english',
    },
    {
      language: 'de',
      value: 'deutsch',
    },
    {
      language: 'fr',
      value: 'français',
    },
    {
      language: 'it',
      value: 'italiano',
    },
    {
      language: 'rm',
      value: 'rumantsch',
    },
  ];
}
