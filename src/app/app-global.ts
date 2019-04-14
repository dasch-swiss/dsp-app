import { MenuItem } from './main/declarations/menu-item';

export class AppGlobal {
    // project navigation
    public static projectNav: MenuItem[] = [
        {
            label: 'Project information',
            route: 'board',
            icon: 'assignment'
        },
        {
            label: 'Collaboration',
            route: 'collaboration',
            icon: 'group'
        },
        {
            label: 'Groups',
            route: 'groups',
            icon: 'supervised_user_circle'
        },
        {
            label: 'Data model',
            route: 'ontologies',
            icon: 'bubble_chart'
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
            label: 'Your Projects',
            route: '/projects',
            icon: 'all_inbox'
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
