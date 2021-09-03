import { Inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, LogoutResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { DialogComponent } from '../dialog/dialog.component';
import { NotificationService } from '../services/notification.service';
import { SessionService } from '../services/session.service';

@Injectable({
    providedIn: 'root'
})
export class ErrorHandlerService {

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _dialog: MatDialog,
        private _session: SessionService,
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

            this._dialog.open(
                DialogComponent,
                dialogConfig
            );

        } else if (error.status === 401 && typeof(error.error) !== 'string') {
            // logout if error status is a 401 error and comes from a DSP-JS request
            this._dspApiConnection.v2.auth.logout().subscribe(
                (logoutResponse: ApiResponseData<LogoutResponse>) => {

                    // destroy (dsp-ui) session
                    this._session.destroySession();

                    // reload the page
                    window.location.reload();
                },
                (logoutError: ApiResponseError) => {
                    this._notification.openSnackBar(logoutError);
                }
            );

        } else {
            // in any other case
            // open snack bar from dsp-ui notification service
            this._notification.openSnackBar(error);
        }
    }
}
