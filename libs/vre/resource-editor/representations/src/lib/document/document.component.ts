import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadDocumentFileValue,
  ReadProject,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
})
export class DocumentComponent implements OnChanges {
  @Input() src: FileRepresentation;
  @Input() parentResource: ReadResource;
  @Input() attachedProject: ReadProject | undefined;

  @ViewChild(PdfViewerComponent) private _pdfComponent: PdfViewerComponent;

  originalFilename: string;

  zoomFactor = 1.0;

  pdfQuery = '';

  failedToLoad = false;

  elem: any;

  fileType: string;

  get usercanEdit() {
    return ResourceUtil.userCanEdit(this.parentResource);
  }

  constructor(
    @Inject(DOCUMENT) private document: any,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _rs: RepresentationService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && changes['src'].currentValue) {
      this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(
        res => {
          this.originalFilename = res['originalFilename'];
        },
        () => {
          // error already handled by getFileInfo
          this.failedToLoad = true;
        }
      );
      this.fileType = this._getFileType(this.src.fileValue.filename);
      if (this.fileType === 'pdf') {
        this.elem = document.getElementsByClassName('pdf-viewer')[0];
      }
    }
  }

  searchQueryChanged(newQuery: string) {
    if (newQuery !== this.pdfQuery) {
      this.pdfQuery = newQuery;
      this._pdfComponent.eventBus.dispatch('find', {
        query: this.pdfQuery,
        highlightAll: true,
      });
    } else {
      this._pdfComponent.eventBus.dispatch('findagain', {
        query: this.pdfQuery,
        highlightAll: true,
      });
    }
  }

  download(fileValue: ReadDocumentFileValue) {
    this._rs.downloadProjectFile(fileValue, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog
      .open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          title: 'Document',
          subtitle: 'Update the document file of this resource',
          representation: Constants.HasDocumentFileValue,
          projectUuid: this.attachedProject!.id,
          propId: this.parentResource.properties[Constants.HasDocumentFileValue][0].id,
        },
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this._replaceFile(data);
        }
      });
  }

  openFullscreen() {
    if (!this.elem) {
      return; // guard
    }
    if (this.elem.requestFullscreen) {
      this.elem.requestFullscreen();
    } else if (this.elem.mozRequestFullScreen) {
      // firefox
      this.elem.mozRequestFullScreen();
    } else if (this.elem.webkitRequestFullscreen) {
      // chrome, safari and opera
      this.elem.webkitRequestFullscreen();
    } else if (this.elem.msRequestFullscreen) {
      // edge, ie
      this.elem.msRequestFullscreen();
    }
  }

  // help the computer add and subtract floating point numbers
  zoom(direction: 'in' | 'out') {
    switch (direction) {
      case 'in':
        this.zoomFactor = Math.round((this.zoomFactor + 0.2) * 100) / 100;
        break;
      case 'out':
        // will the zoomFactor be less than or equal to zero?
        if (Math.round((this.zoomFactor - 0.2) * 100) / 100 <= 0) {
          // cap zoomFactor at 0.2
          this.zoomFactor = 0.2;
        } else {
          this.zoomFactor = Math.round((this.zoomFactor - 0.2) * 100) / 100;
          break;
        }
    }
  }

  private _getFileType(filename: string): string {
    return filename.split('.').pop();
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasDocumentFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap((res: WriteValueResponse) =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid)
        )
      )
      .subscribe((res2: ReadResource) => {
        this.parentResource = res2;
        this.src.fileValue.fileUrl = (
          res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue
        ).fileUrl;
        this.src.fileValue.filename = (
          res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue
        ).filename;
        this.src.fileValue.strval = (
          res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue
        ).strval;
        this.src.fileValue.valueCreationDate = (
          res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue
        ).valueCreationDate;

        this.fileType = this._getFileType(this.src.fileValue.filename);
        if (this.fileType === 'pdf') {
          this.elem = document.getElementsByClassName('pdf-viewer')[0];
        }

        this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(res => {
          this.originalFilename = res['originalFilename'];
        });

        this.zoomFactor = 1.0;
        this.pdfQuery = '';
        this._cd.markForCheck();
      });
  }
}
