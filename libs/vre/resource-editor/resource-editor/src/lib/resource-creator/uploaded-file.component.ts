import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { UploadedFileResponse } from '../representations/upload/upload-file-response.interface';
import { UploadFileService } from '../representations/upload/upload-file.service';

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
  imports: [AsyncPipe, MatCardModule, MatIconModule, MatButtonModule],
})
export class UploadedFileComponent implements OnInit {
  @Input({ required: true }) internalFilename!: string;
  @Input({ required: true }) projectShortcode!: string;

  @Output() removeFile = new EventEmitter<void>();

  fileToUpload$!: Observable<UploadedFileResponse>;

  constructor(private readonly _uploadFileService: UploadFileService) {}

  ngOnInit() {
    const assetId = this.internalFilename.split('.')[0];
    this.fileToUpload$ = this._uploadFileService.getFileInfo(assetId, this.projectShortcode);
  }
}
