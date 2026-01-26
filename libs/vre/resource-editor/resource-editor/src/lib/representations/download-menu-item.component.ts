import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ReadFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { RepresentationService } from './representation.service';

@Component({
  selector: 'app-download-menu-item',
  imports: [TranslatePipe, MatButton, MatIcon],
  template: `
    <button mat-flat-button (click)="download()" data-cy="download-file-button">
      <mat-icon>download</mat-icon>
      {{ 'resourceEditor.representations.downloadFile' | translate }}
    </button>
  `,
})
export class DownloadMenuItemComponent {
  @Input({ required: true }) src!: ReadFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  constructor(private readonly _rs: RepresentationService) {}
  download() {
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }
}
