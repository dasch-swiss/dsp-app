import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnChanges, SimpleChanges, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { catchError, EMPTY } from 'rxjs';
import { DownloadMenuItemComponent } from './download-menu-item.component';
import { ReplaceFileDialogConfig, ReplaceFileMenuItemComponent } from './replace-file-menu-item.component';
import { RepresentationErrorMessageComponent } from './representation-error-message.component';
import { RepresentationService } from './representation.service';
import { ResourceFetcherService } from './resource-fetcher.service';

@Component({
  selector: 'app-file-representation',
  imports: [
    AsyncPipe,
    DownloadMenuItemComponent,
    ReplaceFileMenuItemComponent,
    RepresentationErrorMessageComponent,
    CenteredMessageComponent,
  ],
  template: `
    @if (failedToLoad) {
      <app-representation-error-message />
    } @else if (originalFilename) {
      <div style="padding-top: 20px">
        <app-centered-message [icon]="'description'" [message]="originalFilename" [color]="'white'" />

        <div style="display: flex; justify-content: center; gap: 16px">
          <app-download-menu-item [src]="src" [parentResource]="parentResource" />

          @if (resourceFetcherService.userCanEdit$ | async) {
            <app-replace-file-menu-item
              [dialogConfig]="dialogConfig"
              [parentResource]="parentResource"
              [viewContainerRef]="viewContainerRef" />
          }
        </div>
      </div>
    }
  `,
})
export class FileRepresentationComponent implements OnChanges {
  @Input({ required: true }) src!: ReadArchiveFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) dialogConfig!: ReplaceFileDialogConfig;
  originalFilename?: string;

  failedToLoad = false;

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private readonly _rs: RepresentationService,
    public readonly viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this._rs
        .getFileInfo(this.src.fileUrl)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          catchError(error => {
            console.error('Failed to load file info:', error);
            this.failedToLoad = true;
            return EMPTY;
          })
        )
        .subscribe(res => {
          this.originalFilename = res.originalFilename || res['originalFilename'];
        });
    }
  }
}
