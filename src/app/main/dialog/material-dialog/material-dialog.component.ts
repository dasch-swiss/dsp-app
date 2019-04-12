import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
    mode: string;
    name?: string;      // main iri
    project?: string;   // second iri or connected iri
    confirm?: boolean;
}

@Component({
    selector: 'app-material-dialog',
    templateUrl: './material-dialog.component.html',
    styleUrls: ['./material-dialog.component.scss']
})
export class MaterialDialogComponent implements OnInit {


    constructor(
        public dialogRef: MatDialogRef<MaterialDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) { }

    ngOnInit() {}

    closeDialog(data: any): void {
      this.dialogRef.close();
    }
}
