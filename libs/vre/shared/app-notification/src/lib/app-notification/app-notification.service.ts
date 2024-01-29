import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { HttpStatusMsg } from '@dasch-swiss/vre/shared/assets/status-msg';
import { AjaxError } from 'rxjs/ajax';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private _snackBar: MatSnackBar) {}

  openSnackBar(notification: string, type: 'success' | 'error' = 'success'): void {
    const conf: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type,
    };

    this._snackBar.open(notification, 'x', conf);
  }
}
