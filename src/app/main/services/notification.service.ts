import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { HttpStatusMsg } from 'src/assets/http/statusMsg';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(
        private _snackBar: MatSnackBar,
        private _statusMsg: HttpStatusMsg
    ) { }

    // todo: maybe we can add more parameters like:
    // action: string = 'x', duration: number = 4200
    // and / or type: 'note' | 'warning' | 'error' | 'success'; which can be used for the panelClass
    openSnackBar(notification: string | ApiResponseError, type?: 'success' | 'error'): void {
        let duration = 5000;
        let message: string;
        let panelClass: string;

        if (notification instanceof ApiResponseError) {
            panelClass = type ? type : 'error';
            if (notification.error && !notification.error['message'].startsWith('ajax error')) {
                // the Api response error contains a complex error message from dsp-js-lib
                message = notification.error['message'];
                duration = undefined;
            } else {
                const defaultStatusMsg = this._statusMsg.default;
                message = `${defaultStatusMsg[notification.status].message} (${notification.status}): `;

                if (notification.status === 504) {
                    message += `There was a timeout issue with one or several requests.
                                The resource(s) or a part of it cannot be displayed correctly.
                                Failed on ${notification.url}`;
                    duration = undefined;
                } else {
                    message += `${defaultStatusMsg[notification.status].description}`;
                }
            }
        } else {
            panelClass = type ? type : 'success';
            message = notification;
        }

        this._snackBar.open(message, 'x', {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass
        });
    }
}
