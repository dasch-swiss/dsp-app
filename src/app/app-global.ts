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
        {
            label: 'Dashboard',
            route: '/dashboard',
            icon: 'dashboard'
        },
        {
            label: 'Projects',
            route: '/projects',
            icon: 'all_inbox'
        },
        {
            label: 'Collections',
            route: '/collections',
            icon: 'star'
        },
        {
            label: 'Profile',
            route: '/profile',
            icon: 'account_box'
        },
        {
            label: 'Account',
            route: '/account',
            icon: 'settings'
        }
    ];
}


