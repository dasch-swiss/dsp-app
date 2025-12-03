import { Component, inject, Input } from '@angular/core';
import { Constants, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-resource-actions',
  template: `
    <span class="action">
      <button
        mat-icon-button
        [matTooltip]="'resourceEditor.toolbar.openInNewTab' | translate"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        (click)="openResource()">
        <mat-icon>open_in_new</mat-icon>
      </button>
      <button
        color="primary"
        mat-icon-button
        data-cy="share-button"
        [matTooltip]="
          _translateService.instant('resourceEditor.toolbar.shareResource', { arkUrl: resource.versionArkUrl })
        "
        matTooltipPosition="above"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>

      <app-permission-info [resource]="resource" />
      <ng-content />
    </span>

    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        [matTooltip]="'resourceEditor.toolbar.copyArkUrl' | translate"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.versionArkUrl"
        (click)="notification.openSnackBar(_translateService.instant('resourceEditor.toolbar.arkUrlCopied'))">
        <mat-icon>content_copy</mat-icon>
        {{ 'resourceEditor.toolbar.copyArkUrlToClipboard' | translate }}
      </button>
      <button
        mat-menu-item
        [matTooltip]="'resourceEditor.toolbar.copyInternalLink' | translate"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="notification.openSnackBar(_translateService.instant('resourceEditor.toolbar.internalLinkCopied'))">
        <mat-icon>content_copy</mat-icon>
        {{ 'resourceEditor.toolbar.copyInternalLinkToClipboard' | translate }}
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .action {
        display: inline-flex;

        button {
          border-radius: 0;
        }
      }
    `,
  ],
  standalone: false,
})
export class ResourceActionsComponent {
  @Input({ required: true }) resource!: ReadResource;

  protected readonly _translateService = inject(TranslateService);

  constructor(
    protected notification: NotificationService,
    private readonly _resourceService: ResourceService
  ) {}

  openResource() {
    let resourceId = this.resource.id;
    let qParam = '';
    if (this.resource.entityInfo.classes[Constants.Region]) {
      const linkedResource = this.resource.getValues(Constants.IsRegionOfValue)[0] as ReadLinkValue | undefined;
      resourceId = linkedResource?.linkedResourceIri || resourceId;
      const annotationId = encodeURIComponent(this.resource.id);
      qParam = `?${RouteConstants.annotationQueryParam}=${annotationId}`;
    }
    const resPath = this._resourceService.getResourcePath(resourceId);
    window.open(`/${RouteConstants.resource}${resPath}${qParam}`, '_blank');
  }
}
