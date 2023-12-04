import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { StringLiteral } from '@dasch-swiss/dsp-js';

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

    // system navigation (sys admin only)
    public static systemNav: MenuItem[] = [
        {
            label: 'All projects',
            shortLabel: 'Projects',
            route: RouteConstants.projects,
            icon: 'assignment',
        },
        {
            label: 'All users',
            shortLabel: 'Users',
            route: RouteConstants.users,
            icon: 'group',
        },
    ];

    /*
    {
        label: 'Api status',
        shortLabel: 'Api status',
        route: 'status',
        icon: 'network_check'
    }
    */

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
