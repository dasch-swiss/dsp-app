import { Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-closing-dialog',
  template: ` <div style="padding: 16px">
    <div>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>
    <ng-content />
  </div>`,
  standalone: true,
  imports: [MatIconButton, MatIcon],
})
export class ClosingDialogComponent {
  constructor(public readonly dialogRef: MatDialogRef<unknown>) {}
}
