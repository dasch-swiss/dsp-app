export type AuthError = LoginError | ServerError;

export interface LoginError {
    type: 'login';
    status: number;
    msg: string;
}

export interface ServerError {
    type: 'server';
    status: number;
    msg: string;
}
