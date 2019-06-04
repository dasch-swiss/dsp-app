export interface MenuItem {
    label: string;
    route?: string;
    icon?: string;
    children?: MenuItem[];
}
