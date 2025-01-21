import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadArchiveFileValue,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
})
export class ArchiveComponent implements OnChanges {
  @Input() src: FileRepresentation;
  @Input() parentResource: ReadResource;
  originalFilename: string;

  failedToLoad = false;

  get usercanEdit() {
    return ResourceUtil.userCanEdit(this.parentResource);
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _rs: RepresentationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(
        res => {
          this.originalFilename = res['originalFilename'];
        },
        () => {
          this.failedToLoad = true;
        }
      );
    }
  }

  download() {
    this._rs.downloadProjectFile(this.src.fileValue, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog
      .open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          title: 'Archive',
          subtitle: 'Update the archive file of this resource',
          representation: Constants.HasArchiveFileValue,
          propId: this.parentResource.properties[Constants.HasArchiveFileValue][0].id,
        },
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this._replaceFile(data);
        }
      });
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasArchiveFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap((res: WriteValueResponse) =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid)
        )
      )
      .subscribe((res2: ReadResource) => {
        this.src.fileValue.fileUrl = (
          res2.properties[Constants.HasArchiveFileValue][0] as ReadArchiveFileValue
        ).fileUrl;
        this.src.fileValue.filename = (
          res2.properties[Constants.HasArchiveFileValue][0] as ReadArchiveFileValue
        ).filename;
        this.src.fileValue.strval = (res2.properties[Constants.HasArchiveFileValue][0] as ReadArchiveFileValue).strval;

        this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(res => {
          this.originalFilename = res['originalFilename'];
        });
      });
  }
}
