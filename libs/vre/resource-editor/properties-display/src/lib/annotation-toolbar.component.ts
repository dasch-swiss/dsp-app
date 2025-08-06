import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { RegionService, ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { take } from 'rxjs';

@Component({
  selector: 'app-annotation-toolbar',
  template: `
    <span class="action">
      <button
        mat-icon-button
        matTooltip="Open resource in new tab"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        (click)="openRegionInNewTab()">
        <mat-icon>open_in_new</mat-icon>
      </button>
      <button
        color="primary"
        mat-icon-button
        class="share-res"
        data-cy="share-button"
        matTooltip="Share resource: {{ resource.versionArkUrl }}"
        matTooltipPosition="above"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>
      <app-permission-info [resource]="resource" />
      <app-resource-edit-more-menu
        *ngIf="!!(resourceFetcher.userCanEdit$ | async) || !!(resourceFetcher.userCanDelete$ | async)"
        [resource]="resource"
        [showEditLabel]="true"
        (resourceDeleted)="onResourceDeleted()"
        (resourceErased)="onResourceDeleted()"
        (resourceUpdated)="onResourceUpdated()" />
    </span>

    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        matTooltip="Copy ARK url"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.versionArkUrl"
        (click)="this.notification.openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="this.notification.openSnackBar('Internal link copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy internal link to clipboard
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
})
export class AnnotationToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Input({ required: true }) parentResourceId!: string;

  constructor(
    protected notification: NotificationService,
    private _regionService: RegionService,
    private _resourceService: ResourceService,
    public resourceFetcher: ResourceFetcherService
  ) {}

  onResourceUpdated() {
    this.resourceFetcher.reload();
  }

  onResourceDeleted() {
    this._regionService.updateRegions$().pipe(take(1)).subscribe();
  }

  openRegionInNewTab() {
    const annotationId = encodeURIComponent(this.resource.id);
    const resPath = this._resourceService.getResourcePath(this.parentResourceId);
    window.open(
      `/${RouteConstants.resource}${resPath}?${RouteConstants.annotationQueryParam}=${annotationId}`,
      '_blank'
    );
  }
}
