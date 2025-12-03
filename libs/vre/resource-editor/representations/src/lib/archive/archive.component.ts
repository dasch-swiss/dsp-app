import { Component, inject, Input, OnChanges, SimpleChanges, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
  standalone: false,
})
export class ArchiveComponent implements OnChanges {
  @Input({ required: true }) src!: ReadArchiveFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  originalFilename?: string;

  failedToLoad = false;

  private readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _rs: RepresentationService,
    private readonly _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this._rs.getFileInfo(this.src.fileUrl).subscribe(
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
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: this._translateService.instant('resourceEditor.representations.archive.title'),
        subtitle: this._translateService.instant('resourceEditor.representations.archive.updateFile'),
        representation: Constants.HasArchiveFileValue,
        resource: this.parentResource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }
}
