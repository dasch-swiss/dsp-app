import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UploadedFileResponse, UploadFileService } from '@dasch-swiss/vre/resource-editor/representations';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-uploaded-file',
  template: ` @if (fileToUpload$ | async; as fileToUpload) {
    <mat-card>
      <mat-card-content style="display: flex; align-items: center">
        <mat-icon color="primary">description</mat-icon>
        <div style="flex: 1; margin-left: 8px">{{ fileToUpload.originalFilename }}</div>
        <button mat-icon-button (click)="removeFile.emit()">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-card-content>
    </mat-card>
  }`,
})
export class UploadedFileComponent implements OnInit {
  @Input({ required: true }) internalFilename!: string;
  @Input({ required: true }) projectShortcode!: string;

  @Output() removeFile = new EventEmitter<void>();

  fileToUpload$!: Observable<UploadedFileResponse>;

  constructor(private _uploadFileService: UploadFileService) {}

  ngOnInit() {
    const assetId = this.internalFilename.split('.')[0];
    this.fileToUpload$ = this._uploadFileService.getFileInfo(assetId, this.projectShortcode);
  }
}
