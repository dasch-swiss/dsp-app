import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/*
export interface DialogData {
    mode: string;       // switch on mode
    name?: string;      // main iri
    project?: string;   // second iri or connected iri
    confirm?: boolean;
}
*/

// TODO: replace the interface above with the following
export interface DialogData {
    mode: string;       // switch mode
    id: string;         // main iri
    project?: string;   // project code
    title?: string;
    subtitle?: string;
    comment?: string;
    name?: string;      // deprecated; TODO: clean it up everywhere. Use title instead
}

@Component({
    selector: 'app-material-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

    constructor (
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) { }

    ngOnInit() { }

    closeDialog(data: any): void {
        this.dialogRef.close();
    }

    replaceTitle(title: string) {
        this.data.title = title;
    }
}
