import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

    confirmButtonText: string;
    confirmButtonColor: string;

    constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
                private _dialogRef: MatDialogRef<ConfirmDialogComponent>) {
    }

    ngOnInit() {

        this.confirmButtonText = (this.data.confirm ? 'Yes' : 'OK');
        this.confirmButtonColor = (this.data.confirm ? 'warn' : 'primary');

    }

    confirmDelete() {
//        console.log(this.data);
        this.data.answer = true;
//        console.log(this.data);
        this._dialogRef.close();
    }
}
