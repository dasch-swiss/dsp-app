/**
 * information about the current user
 */
export interface CurrentUser {
    // username
    name: string;

    // json web token
    jwt?: string;

    // default language for ui
    lang: string;

    // is system admin?
    sysAdmin: boolean;

    // list of project shortcodes where the user is project admin
    projectAdmin: string[];
}

/**
 * session with id (= login timestamp) and information about logged-in user
 */
export interface Session {
    id: number;
    user: CurrentUser;
}
