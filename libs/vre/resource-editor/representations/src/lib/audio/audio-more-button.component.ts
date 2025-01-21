import { Component, Inject, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { getFileValue } from '../get-file-value';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';

@Component({
  selector: 'app-audio-more-button',
  template: ` <button mat-icon-button [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #more="matMenu" class="representation-menu">
      <button mat-menu-item (click)="openIIIFnewTab()">Open audio in new tab</button>
      <button mat-menu-item [cdkCopyToClipboard]="src.fileValue.fileUrl">Copy audio URL to clipboard</button>
      <button mat-menu-item (click)="download(src.fileValue.fileUrl)">Download audio</button>
      <button mat-menu-item [disabled]="!userCanEdit" (click)="openReplaceFileDialog()">Replace file</button>
    </mat-menu>`,
})
export class AudioMoreButtonComponent {
  @Input({ required: true }) parentResource!: ReadResource;

  get src() {
    return new FileRepresentation(getFileValue(new DspResource(this.parentResource))!);
  }

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.parentResource);
  }

  constructor(
    private _dialog: MatDialog,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _rs: RepresentationService,
    private _resourceFetcher: ResourceFetcherService
  ) {}

  openReplaceFileDialog() {
    this._dialog
      .open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          title: 'Audio',
          subtitle: 'Update the audio file of this resource',
          representation: Constants.HasAudioFileValue,
          propId: this.parentResource.properties[Constants.HasAudioFileValue][0].id,
        },
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this._replaceFile(data);
        }
      });
  }

  openIIIFnewTab() {
    window.open(this.src.fileValue.fileUrl, '_blank');
  }

  download(url: string) {
    this._rs.downloadProjectFile(this.src.fileValue, this.parentResource);
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasAudioFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap(res =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, (res as WriteValueResponse).uuid)
        )
      )
      .subscribe(() => {
        this._resourceFetcher.reload();
      });
  }
}
