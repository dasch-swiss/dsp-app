import { MenuItem } from './main/declarations/menu-item';

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
            route: 'info',
            icon: 'assignment'
        },
        {
            label: 'Collaboration',
            route: 'collaboration',
            icon: 'group'
        },
        {
            label: 'Permission groups',
            route: 'permissions',
            icon: 'lock_open'
        },
        {
            label: 'Data model',
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
            route: '/dashboard',
            icon: 'dashboard'
        },
        {
            label: 'Your Projects',
            route: '/projects',
            icon: 'assignment'
        },
        {
            label: 'Your Collections',
            route: '/collections',
            icon: 'star'
        },
        {
            label: 'Account',
            route: '/account',
            icon: 'settings'
        }
    ];

    public static systemNav: MenuItem[] = [
        {
            label: 'All projects',
            route: 'projects',
            icon: 'assignment'
        },
        {
            label: 'All users',
            route: 'users',
            icon: 'group'
        },
        {
            label: 'Api status',
            route: 'status',
            icon: 'network_check'
        }
    ];
}
