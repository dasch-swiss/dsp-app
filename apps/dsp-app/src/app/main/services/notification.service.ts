import { Injectable } from '@angular/core';
import {
    MatLegacySnackBar as MatSnackBar,
    MatLegacySnackBarConfig as MatSnackBarConfig,
} from '@angular/material/legacy-snack-bar';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { HttpStatusMsg } from '@dsp-app/src/assets/http/statusMsg';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    constructor(
        private _snackBar: MatSnackBar,
        private _statusMsg: HttpStatusMsg
    ) {}

    // todo: maybe we can add more parameters like:
    // action: string = 'x', duration: number = 4200
    // and / or type: 'note' | 'warning' | 'error' | 'success'; which can be used for the panelClass
    openSnackBar(
        notification: string | ApiResponseError,
        type?: 'success' | 'error'
    ): void {
        let message: string;

        const conf: MatSnackBarConfig = {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: type ? type : 'error',
        };

        if (notification instanceof ApiResponseError) {
            conf.panelClass = type ? type : 'error';
            if (
                notification.error &&
                !notification.error['message'].startsWith('ajax error')
            ) {
                // the Api response error contains a complex error message from dsp-js-lib
                message = notification.error['message'];
            } else {
                const defaultStatusMsg = this._statusMsg.default;
                message = `${defaultStatusMsg[notification.status].message} (${
                    notification.status
                }): `;

                if (notification.status === 504) {
                    message += `There was a timeout issue with one or several requests.
                                The resource(s) or a part of it cannot be displayed correctly.
                                Failed on ${notification.url}`;
                    conf.duration = null;
                } else {
                    message += `${
                        defaultStatusMsg[notification.status].description
                    }`;
                }
            }
        } else {
            conf.panelClass = type ? type : 'success';
            message = notification;
        }

        this._snackBar.open(message, 'x', conf);
    }
}
