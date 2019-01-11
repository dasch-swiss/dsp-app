import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { FullframeDialogComponent } from './fullframe-dialog/fullframe-dialog.component';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

    constructor(public dialog: MatDialog) {
        this.openDialog();
    }

    ngOnInit() {

    }

    openDialog(): void {
        const config = new MatDialogConfig();
        const answer: boolean = false;

        config.data = {
            title: 'Are you sure to remove this user from the project?',
            confirm: true,
            answer: answer
        };

        const dialogRef = this.dialog.open(FullframeDialogComponent, config);

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
            if (config.data.confirm === true) {
            }
        });
    }
}
