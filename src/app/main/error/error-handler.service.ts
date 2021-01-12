import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/dsp-ui';
import { DialogComponent } from '../dialog/dialog.component';

@Injectable({
    providedIn: 'root'
})
export class ErrorHandlerService {

    constructor(
        private _notification: NotificationService,
        private _dialog: MatDialog
    ) { }

    showMessage(error: ApiResponseError) {
        // in case of (internal) server error
        if (error.status === 0 || (error.status > 499 && error.status < 600)) {
            const status = (error.status === 0 ? 503 : error.status);

            // open error message in full size view
            const dialogConfig: MatDialogConfig = {
                width: '100vw',
                maxWidth: '100vw',
                height: '100vh',
                maxHeight: '100vh',
                position: {
                    top: '0'
                },
                data: { mode: 'error', id: status },
                disableClose: true
            };

            const dialogRef = this._dialog.open(
                DialogComponent,
                dialogConfig
            );

        } else {
            // in any other case
            // open snack bar from dsp-ui notification service
            this._notification.openSnackBar(error);
        }
    }
}
