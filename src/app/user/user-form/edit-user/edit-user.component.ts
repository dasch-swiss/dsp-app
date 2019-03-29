import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { UserFormComponent } from '../user-form.component';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {

  constructor(public dialog: MatDialog,
    private _dialogRef: MatDialogRef<EditUserComponent>) { }

  ngOnInit() {
    this.openDialog();
  }

  openDialog() {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '250px'
    });
  }

}
