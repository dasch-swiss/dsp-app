import { Component, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspResource, ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { DialogComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { getFileValue } from '../get-file-value';
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
    const propId = this.parentResource.properties[Constants.HasAudioFileValue][0].id;

    const dialogConfig: MatDialogConfig = {
      width: '800px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'replaceFile',
        title: 'Audio',
        subtitle: 'Update the audio file of this resource',
        representation: 'audio',
        attachedProject: this._rs.getAttachedProject(this.parentResource),
        id: propId,
      },
      disableClose: true,
    };
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this._replaceFile(data);
      }
    });
  }

  openIIIFnewTab() {
    window.open(this.src.fileValue.fileUrl, '_blank');
  }

  download(url: string) {
    this._rs.downloadFile(url);
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
