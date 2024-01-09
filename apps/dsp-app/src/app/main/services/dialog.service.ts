import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../action/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private _dialog: MatDialog) {}

  afterConfirmation(message: string, title: string | null = null) {
    return this._dialog
      .open<ConfirmDialogComponent, any, boolean>(ConfirmDialogComponent, {
        data: {
          title,
          message,
        },
      })
      .afterClosed()
      .pipe(filter(response => response === true));
  }
}
