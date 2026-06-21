import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

export interface ResourceAuthorshipEditDialogProps {
  authorship: string[];
}

/**
 * Minimal dialog to edit a resource's per-resource authorship; returns the new list on save (or undefined on cancel).
 * TODO(verify-locally): mat-chips API is version-specific — confirm chip-grid/input wiring against the installed Material version.
 */
@Component({
  selector: 'app-resource-authorship-edit-dialog',
  template: `
    <h1 mat-dialog-title>{{ 'legal.dataSide.authorship' | translate }}</h1>
    <mat-dialog-content>
      <mat-form-field style="width: 100%">
        <mat-chip-grid #chipGrid>
          @for (author of authorship; track author) {
            <mat-chip-row (removed)="remove(author)">
              {{ author }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip-row>
          }
          <input [matChipInputFor]="chipGrid" (matChipInputTokenEnd)="add($event)" />
        </mat-chip-grid>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">{{ 'legal.dataSide.settings.cancel' | translate }}</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="authorship">
        {{ 'legal.dataSide.settings.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIcon, TranslatePipe],
})
export class ResourceAuthorshipEditDialogComponent {
  authorship: string[];

  constructor(
    private readonly _dialogRef: MatDialogRef<ResourceAuthorshipEditDialogComponent, string[] | undefined>,
    @Inject(MAT_DIALOG_DATA) data: ResourceAuthorshipEditDialogProps
  ) {
    this.authorship = [...data.authorship];
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.authorship = [...this.authorship, value];
    }
    event.chipInput!.clear();
  }

  remove(author: string): void {
    this.authorship = this.authorship.filter(a => a !== author);
  }
}
