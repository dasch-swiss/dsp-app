import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadProject,
  ReadResource,
  ReadTextFileValue,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent implements OnInit, AfterViewInit {
  @Input() src: FileRepresentation;
  @Input() attachedProject: ReadProject | undefined;
  @Input() parentResource: ReadResource;

  @Output() loaded = new EventEmitter<boolean>();

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

  ngOnInit(): void {
    this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(
      res => {
        this.originalFilename = res['originalFilename'];
      },
      () => {
        this.failedToLoad = true;
      }
    );
  }

  ngAfterViewInit() {
    this.loaded.emit(true);
  }

  download(url: string) {
    this._rs.downloadFile(url);
  }

  openReplaceFileDialog() {
    this._dialog
      .open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          title: 'Text (csv, txt, xml)',
          subtitle: 'Update the text file of this resource',
          representation: Constants.HasTextFileValue,
          projectUuid: this.attachedProject!.id,
          propId: this.parentResource.properties[Constants.HasTextFileValue][0].id,
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
    updateRes.property = Constants.HasTextFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap((res: WriteValueResponse) =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid)
        )
      )
      .subscribe((res2: ReadResource) => {
        this.src.fileValue.fileUrl = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).fileUrl;
        this.src.fileValue.filename = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).filename;
        this.src.fileValue.strval = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).strval;

        this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(res => {
          this.originalFilename = res['originalFilename'];
        });
      });
  }
}
