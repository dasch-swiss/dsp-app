import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-closing-dialog',
  template: ` <div style="padding: 16px">
    <div>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>
    <ng-content />
  </div>`,
  imports: [MatButtonModule, MatIconModule],
})
export class ClosingDialogComponent {
  constructor(public readonly dialogRef: MatDialogRef<unknown>) {}
}
