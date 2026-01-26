import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from './replace-file-dialog/replace-file-dialog.component';

export interface ReplaceFileDialogConfig {
  title: string;
  representation: string;
}

@Component({
  selector: 'app-replace-file-menu-item',
  imports: [TranslatePipe, MatButton],
  template: `
    <button mat-flat-button (click)="openReplaceFileDialog()" data-cy="replace-file-button">
      {{ 'resourceEditor.representations.replaceFile' | translate }}
    </button>
  `,
})
export class ReplaceFileMenuItemComponent {
  @Input({ required: true }) dialogConfig!: ReplaceFileDialogConfig;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) viewContainerRef!: ViewContainerRef;

  constructor(private readonly _dialog: MatDialog) {}

  openReplaceFileDialog() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: this.dialogConfig.title,
        representation: this.dialogConfig.representation,
        resource: this.parentResource,
      }),
      viewContainerRef: this.viewContainerRef,
    });
  }
}
