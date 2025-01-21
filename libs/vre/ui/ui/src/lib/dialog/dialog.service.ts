import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, take } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogProps } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private _dialog: MatDialog) {}

  afterConfirmation(message: string, title: string | null = null, subtitle: string | null = null) {
    return this._dialog
      .open<ConfirmDialogComponent, ConfirmDialogProps, boolean>(ConfirmDialogComponent, {
        data: {
          message,
          title,
          subtitle,
        },
      })
      .afterClosed()
      .pipe(
        filter(response => response === true),
        take(1)
      );
  }
}
