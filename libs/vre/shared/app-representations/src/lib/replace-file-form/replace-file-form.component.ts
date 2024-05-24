import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UpdateFileValue } from '@dasch-swiss/dsp-js';
import { UploadComponent } from '../upload/upload.component';

@Component({
  selector: 'app-replace-file-form',
  templateUrl: './replace-file-form.component.html',
  styleUrls: ['./replace-file-form.component.scss'],
})
export class ReplaceFileFormComponent implements OnInit {
  @Input() representation: 'stillImage' | 'movingImage' | 'audio' | 'document' | 'text' | 'archive';
  @Input() propId: string;

  @Output() closeDialog: EventEmitter<UpdateFileValue> = new EventEmitter<UpdateFileValue>();

  @ViewChild('upload') uploadComponent: UploadComponent;

  fileValue: UpdateFileValue;
  warningMessages: string[];

  ngOnInit(): void {
    this._generateWarningMessage(this.representation);
  }

  setFileValue(file: UpdateFileValue) {
    this.fileValue = file;
  }

  saveFile() {
    const updateVal = this.uploadComponent.getUpdatedValue(this.propId);

    if (updateVal instanceof UpdateFileValue) {
      updateVal.filename = this.fileValue.filename;
      updateVal.id = this.propId;
      this.closeDialog.emit(updateVal);
    } else {
      console.error('expected UpdateFileValue, got: ', updateVal);
    }
  }

  // generate the warning message strings with the correct representation type
  _generateWarningMessage(representationType: string) {
    this.warningMessages = [];

    if (representationType === undefined) {
      this.warningMessages.push('File will be replaced.');
      this.warningMessages.push('Please note that you are about to replace the file');
    }

    let repType = representationType;

    if (representationType === 'stillImage' || representationType === 'movingImage') {
      switch (representationType) {
        case 'stillImage':
          repType = 'image';
          break;

        case 'movingImage':
          repType = 'video';
          break;
      }
    }

    const capitalized = repType[0].toUpperCase() + repType.substring(1).toLowerCase();

    this.warningMessages.push(`${capitalized} will be replaced.`);
    this.warningMessages.push(`Please note that you are about to replace the ${repType}.`);
  }
}
