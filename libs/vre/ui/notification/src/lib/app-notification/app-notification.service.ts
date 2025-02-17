import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

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
      panelClass: [type, 'data-cy-snackbar'], // add data-cy for testing purposes
    };

    this._snackBar.open(notification, 'x', conf);
  }
}
