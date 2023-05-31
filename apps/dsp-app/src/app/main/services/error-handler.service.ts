import { Inject, Injectable } from '@angular/core';
import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
} from '@angular/material/dialog';
import {
    ApiResponseData,
    ApiResponseError,
    HealthResponse,
    KnoraApiConnection,
} from '@dasch-swiss/dsp-js';
import { HttpStatusMsg } from '../../../assets/http/statusMsg';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '../dialog/dialog.component';
import { NotificationService } from '../services/notification.service';
import { SessionService } from '../services/session.service';

@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    dialogRef: MatDialogRef<any>;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _dialog: MatDialog,
        private _session: SessionService,
        private _statusMsg: HttpStatusMsg
    ) {}

    showMessage(error: ApiResponseError) {
        // in case of (internal) server error
        const apiServerError = error.error && !error.error['response'];

        const apiResponseMessage = error.error['response']
            ? error.error['response'].error
            : undefined;

        if (
            ((error.status > 499 && error.status < 600) || apiServerError) &&
            error.status !== 504
        ) {
            let status = apiServerError ? 503 : error.status;

            // check if the api is healthy:
            this._dspApiConnection.system.healthEndpoint
                .getHealthStatus()
                .subscribe(
                    (response: ApiResponseData<HealthResponse>) => {
                        if (!response.body.status) {
                            const healthError: ApiResponseError = {
                                error: response.body.message,
                                method: response.method,
                                status: 500,
                                url: error.url,
                            };
                            status = 500;
                            error = healthError;
                            throw new Error(
                                `ERROR ${status}: Server side error — dsp-api is not healthy`
                            );
                        } else {
                            throw new Error(
                                `ERROR ${status}: Server side error — dsp-api not responding`
                            );
                        }
                    },
                    (healthError: ApiResponseError) => {
                        error = healthError;
                    }
                );

            // open error message in full size view
            const dialogConfig: MatDialogConfig = {
                width: '100vw',
                maxWidth: '100vw',
                height: '100vh',
                maxHeight: '100vh',
                position: {
                    top: '0',
                },
                data: {
                    mode: 'error',
                    id: status,
                    comment: apiResponseMessage,
                    fullSize: true,
                },
                disableClose: true,
            };

            if (!this.dialogRef) {
                this.dialogRef = this._dialog.open(
                    DialogComponent,
                    dialogConfig
                );
            }
        } else if (error.status === 401 && typeof error.error !== 'string') {
            // logout if error status is a 401 error and comes from a DSP-JS request
            this._dspApiConnection.v2.auth.logout().subscribe(
                () => {
                    // destroy session
                    this._session.destroySession();

                    // reload the page
                    window.location.reload();
                },
                (logoutError: ApiResponseError) => {
                    this._notification.openSnackBar(logoutError);
                    throw new Error(logoutError.error['message']);
                }
            );
        } else {
            // open snack bar in any other case
            this._notification.openSnackBar(error);
            // log error to Rollbar (done automatically by simply throwing a new Error)
            if (error instanceof ApiResponseError) {
                if (
                    error.error &&
                    !error.error['message'].startsWith('ajax error')
                ) {
                    // the Api response error contains a complex error message from dsp-js-lib
                    throw new Error(error.error['message']);
                } else {
                    const defaultStatusMsg = this._statusMsg.default;
                    const message = `${
                        defaultStatusMsg[error.status].message
                    } (${error.status}): ${
                        defaultStatusMsg[error.status].description
                    }`;
                    throw new Error(message);
                }
            } else {
                throw new Error(error);
            }
        }
    }
}
