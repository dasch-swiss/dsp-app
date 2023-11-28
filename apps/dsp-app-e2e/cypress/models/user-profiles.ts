export interface User {
    username: string;
    password: string;
}

export interface UserProfiles {
    admin_username: string;
    admin_password: string;
    change_admin_password: string;
    projectMember_username: string;
    projectMember_password: string;
    change_projectMember_password: string;
    systemAdmin_username: string;
    systemAdmin_password: string;
    systemAdmin_username_root: string;
    systemAdmin_password_root: string;
    change_systemAdmin_password: string;
}
