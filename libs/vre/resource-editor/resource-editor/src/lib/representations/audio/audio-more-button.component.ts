import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, ViewContainerRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Constants, ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { getFileValue } from '../get-file-value';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';

@Component({
  selector: 'app-audio-more-button',
  imports: [AsyncPipe, CdkCopyToClipboard, MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, TranslatePipe],
  template: ` <button mat-icon-button [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #more="matMenu" class="representation-menu">
      <button mat-menu-item (click)="openIIIFnewTab()">
        {{ 'resourceEditor.representations.audio.openInNewTab' | translate }}
      </button>
      <button mat-menu-item [cdkCopyToClipboard]="fileValue.fileUrl">
        {{ 'resourceEditor.representations.audio.copyUrl' | translate }}
      </button>
      <button mat-menu-item (click)="download()">
        {{ 'resourceEditor.representations.audio.download' | translate }}
      </button>
      @if (resourceFetcherService.userCanEdit$ | async) {
        <button mat-menu-item (click)="openReplaceFileDialog()">
          {{ 'resourceEditor.representations.replaceFile' | translate }}
        </button>
      }
    </mat-menu>`,
})
export class AudioMoreButtonComponent {
  @Input({ required: true }) parentResource!: ReadResource;

  private readonly _translateService = inject(TranslateService);

  get fileValue() {
    return getFileValue(this.parentResource) as ReadAudioFileValue;
  }

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _rs: RepresentationService,
    private readonly _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  openReplaceFileDialog() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: this._translateService.instant('resourceEditor.representations.audio.title'),
        subtitle: this._translateService.instant('resourceEditor.representations.audio.updateFile'),
        representation: Constants.HasAudioFileValue,
        resource: this.parentResource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }

  openIIIFnewTab() {
    window.open(this.fileValue.fileUrl, '_blank');
  }

  download() {
    this._rs.downloadProjectFile(this.fileValue, this.parentResource);
  }
}
