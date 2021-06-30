import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PropertyInfoObject } from 'src/app/project/ontology/default-data/default-properties';

export interface DialogData {
    mode: string;       // switch mode
    id: string | number;         // main iri or status code
    project?: string;   // project code
    title?: string;
    subtitle?: string;
    comment?: string;
    name?: string;
    existing?: string[];
    propInfo?: PropertyInfoObject;
    canBeUpdated?: boolean;
    position?: number;
    parentIri?: string;
    projectCode?: string;
}

@Component({
    selector: 'app-material-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

    notYetImplemented = `The component <strong>${this.data.mode}</strong> is not implemented yet.`;

    constructor(
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) { }

    ngOnInit() { }

    closeDialog(data: any): void {
        this.dialogRef.close();
    }

    replaceTitle(heading: { title: string; subtitle?: string }) {
        this.data.title = heading.title;

        if (heading.subtitle) {
            this.data.subtitle = heading.subtitle;
        }
    }
}
