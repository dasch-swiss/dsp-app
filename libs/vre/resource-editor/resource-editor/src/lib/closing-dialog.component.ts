import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-closing-dialog',
  template: ` <div style="padding: 16px">
    <div>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>
    <ng-content />
  </div>`,
  standalone: false,
})
export class ClosingDialogComponent {
  constructor(public readonly dialogRef: MatDialogRef<unknown>) {}
}
