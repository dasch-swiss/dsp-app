import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadValue } from '@dasch-swiss/dsp-js';
import { ConfirmationMessageComponent } from './confirmation-message/confirmation-message.component';

export class ConfirmationDialogData {
  value: ReadValue;
  buttonTextOk: string;
  buttonTextCancel: string;
}

export class ConfirmationDialogValueDeletionPayload {
  confirmed: boolean;
  deletionComment?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  @ViewChild('confirmMessage')
  confirmationMessageComponent: ConfirmationMessageComponent;
  // type assertion doesn't seem to be enforced
  // https://stackoverflow.com/a/57787554
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
    private _dialogRef: MatDialogRef<ConfirmationDialogComponent>
  ) {}

  onConfirmClick(): void {
    const payload = new ConfirmationDialogValueDeletionPayload();
    payload.confirmed = true;
    payload.deletionComment = this.confirmationMessageComponent.comment
      ? this.confirmationMessageComponent.comment
      : undefined;
    this._dialogRef.close(payload);
  }
}
