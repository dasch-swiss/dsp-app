import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { StatusMsg } from 'src/assets/http/statusMsg';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(
        private _snackBar: MatSnackBar,
        private _statusMsg: StatusMsg
    ) { }

    // todo: maybe we can add more parameters like:
    // action: string = 'x', duration: number = 4200
    // and / or type: 'note' | 'warning' | 'error' | 'success'; which can be used for the panelClass
    openSnackBar(notification: string | ApiResponseError): void {
        const duration = 5000;
        let message: string;
        let panelClass: string;

        if (notification instanceof ApiResponseError) {
            const status = (notification.status === 0 ? 503 : notification.status);
            const defaultStatusMsg = this._statusMsg.default;
            message = `${defaultStatusMsg[status].message} (${status}): ${defaultStatusMsg[status].description}`;
            panelClass = 'error';
        } else {
            message = notification;
            panelClass = 'success';
        }

        this._snackBar.open(message, 'x', {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass
        });
    }
}
