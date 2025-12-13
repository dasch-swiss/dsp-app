import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DialogHeaderComponent } from '../dialog-header.component';

export interface ConfirmDialogProps {
  message: string;
  title: string | null;
  subtitle: string | null;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <app-dialog-header
      [title]="data.title ?? ('ui.dialog.confirmationNeeded' | translate)"
      [subtitle]="data.subtitle ?? ''" />
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">{{ 'ui.dialog.no' | translate }}</button>
      <button mat-raised-button color="warn" (click)="dialogRef.close(true)" data-cy="confirmation-button">
        {{ 'ui.dialog.yes' | translate }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogHeaderComponent, MatButtonModule, MatDialogModule, TranslateModule],
})
export class ConfirmDialogComponent {
  constructor(
    public readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogProps
  ) {}
}
