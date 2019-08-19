import { MenuItem } from './main/declarations/menu-item';
import { StringLiteral } from '@knora/core';

export class AppGlobal {

    // iri base url TODO: should we move this base to the KnoraConstants in knora-ui core?
    public static iriBase: string = 'http://rdfh.ch/';
    public static iriProjectsBase: string = AppGlobal.iriBase + 'projects/';
    public static iriUsersBase: string = AppGlobal.iriBase + 'users/';
    public static iriListsBase: string = AppGlobal.iriBase + 'lists/';


    // project navigation
    public static projectNav: MenuItem[] = [
        {
            label: 'Project information',
            shortLabel: 'Project',
            route: 'info',
            icon: 'assignment'
        },
        {
            label: 'Collaboration',
            shortLabel: 'Collaboration',
            route: 'collaboration',
            icon: 'group'
        },
        {
            label: 'Permission groups',
            shortLabel: 'Groups',
            route: 'permissions',
            icon: 'lock_open'
        },
        {
            label: 'Data model',
            shortLabel: 'Data model',
            route: 'ontologies',
            icon: 'bubble_chart'
        },
        {
            label: 'Lists',
            route: 'lists',
            icon: 'list'
        }
    ];

    // user navigation
    public static userNav: MenuItem[] = [
        /*
        {
            label: 'Dashboard',
            route: '/dashboard',
            icon: 'dashboard'
        },
        */
        {
            label: 'Dashboard',
            shortLabel: 'Dashboard',
            route: '/dashboard',
            icon: 'dashboard'
        },
        {
            label: 'Your Projects',
            shortLabel: 'Projects',
            route: '/projects',
            icon: 'assignment'
        },
        {
            label: 'Your Collections',
            shortLabel: 'Collections',
            route: '/collections',
            icon: 'star'
        },
        {
            label: 'Account',
            shortLabel: 'Account',
            route: '/account',
            icon: 'settings'
        }
    ];

    // system navigation (sys admin only)
    public static systemNav: MenuItem[] = [
        {
            label: 'All projects',
            shortLabel: 'Projects',
            route: 'projects',
            icon: 'assignment'
        },
        {
            label: 'All users',
            shortLabel: 'Users',
            route: 'users',
            icon: 'group'
        },
        {
            label: 'Api status',
            shortLabel: 'Api status',
            route: 'status',
            icon: 'network_check'
        }
    ];

    // possible languages, will be used in form and to change the gui language
    public static languagesList: StringLiteral[] = [
        {
            language: 'en',
            value: 'english'
        },
        {
            language: 'de',
            value: 'deutsch'
        },
        {
            language: 'fr',
            value: 'français'
        },
        {
            language: 'it',
            value: 'italiano'
        }
    ];
}
