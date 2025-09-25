import { Component, Input } from '@angular/core';
import { Constants, ReadColorValue, ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { RegionService, ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { take } from 'rxjs';

@Component({
  selector: 'app-annotation-toolbar',
  template: `
    <div class="actions">
      @if (!toolBarActive) {
        <span class="color-value">
          <app-color-viewer [value]="readColorValue" />
        </span>
      } @else {
        <button
          mat-icon-button
          matTooltip="Highlight Region"
          color="primary"
          matTooltipPosition="above"
          (click)="onPinPointClicked()">
          <mat-icon>my_location</mat-icon>
        </button>
      }
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
      @if (!!(resourceFetcher.userCanEdit$ | async) || !!(resourceFetcher.userCanDelete$ | async)) {
        <app-resource-edit-more-menu
          [resource]="resource"
          [showEditLabel]="true"
          (resourceDeleted)="onResourceDeleted()"
          (resourceErased)="onResourceDeleted()"
          (resourceUpdated)="onResourceUpdated()" />
      }
    </div>
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
      .actions {
        display: flex;
        align-items: center;

        .color-value {
          display: flex;
          align-items: center;
        }

        button {
          border-radius: 0;
        }
      }
    `,
  ],
  standalone: false,
})
export class AnnotationToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Input({ required: true }) parentResourceId!: string;
  @Input() toolBarActive = false;

  get readColorValue() {
    const colorValues: ReadColorValue[] = this.resource.properties[Constants.HasColor] as ReadColorValue[];
    return colorValues && colorValues.length ? colorValues[0] : null;
  }

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

  onPinPointClicked() {
    this.resourceFetcher.scrollToTop();
  }
}
