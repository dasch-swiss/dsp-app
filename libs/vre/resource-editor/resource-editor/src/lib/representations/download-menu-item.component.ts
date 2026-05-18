import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { isPlaceholderAsset } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FileRepresentationInput, ParentResourceInput } from './representation-inputs';
import { RepresentationService } from './representation.service';

@Component({
  selector: 'app-download-menu-item',
  standalone: true,
  imports: [MatButton, MatIcon, TranslatePipe],
  template: `
    <div style="display: flex; gap: 16px">
      <button mat-flat-button (click)="download()" [disabled]="isPlaceholder" [attr.aria-disabled]="isPlaceholder">
        <mat-icon>download</mat-icon>
        {{ 'resourceEditor.representations.downloadFile' | translate }}
      </button>

      <button mat-flat-button (click)="copyUrl()" [disabled]="isPlaceholder" [attr.aria-disabled]="isPlaceholder">
        <mat-icon>link</mat-icon>
        {{ 'resourceEditor.representations.copyLink' | translate }}
      </button>
    </div>
  `,
})
export class DownloadMenuItemComponent {
  @Input({ required: true }) src!: FileRepresentationInput;
  @Input({ required: true }) parentResource!: ParentResourceInput;

  get isPlaceholder(): boolean {
    return isPlaceholderAsset(this.src);
  }

  private readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _rs: RepresentationService,
    private _clipboard: Clipboard,
    private readonly _notification: NotificationService
  ) {}

  download() {
    if (this.isPlaceholder) return;
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }

  copyUrl() {
    if (this.isPlaceholder) return;
    this._rs.getIngestOriginalUrl(this.src, this.parentResource).subscribe(link => {
      this._clipboard.copy(link);
      this._notification.openSnackBar(this._translateService.instant('resourceEditor.representations.fileLinkCopied'));
    });
  }
}
