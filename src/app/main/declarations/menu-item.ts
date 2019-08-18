export interface MenuItem {
    label: string;
    shortLabel?: string;
    route?: string;
    icon?: string;
    children?: MenuItem[];
}
