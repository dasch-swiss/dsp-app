import { Component, inject, Input } from '@angular/core';
import { Constants, ReadColorValue, ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { RegionService, ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
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
          [matTooltip]="'resourceEditor.propertiesDisplay.annotationToolbar.highlightRegion' | translate"
          color="primary"
          matTooltipPosition="above"
          (click)="onPinPointClicked()">
          <mat-icon>my_location</mat-icon>
        </button>
      }
      <button
        mat-icon-button
        [matTooltip]="'resourceEditor.propertiesDisplay.annotationToolbar.openInNewTab' | translate"
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
        [matTooltip]="
          _translateService.instant('resourceEditor.propertiesDisplay.annotationToolbar.shareResource', {
            arkUrl: resource.versionArkUrl,
          })
        "
        matTooltipPosition="above"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>
      <app-permission-info [resource]="resource" />
      <app-incoming-resource-more-menu
        [resource]="resource"
        (resourceDeleted)="onResourceDeleted()"
        (resourceErased)="onResourceDeleted()"
        (resourceUpdated)="onResourceUpdated()" />
    </div>
    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        [matTooltip]="'resourceEditor.propertiesDisplay.annotationToolbar.copyArkUrl' | translate"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.versionArkUrl"
        (click)="
          this.notification.openSnackBar(
            _translateService.instant('resourceEditor.propertiesDisplay.annotationToolbar.arkUrlCopied')
          )
        ">
        <mat-icon>content_copy</mat-icon>
        {{ 'resourceEditor.propertiesDisplay.annotationToolbar.copyArkUrlToClipboard' | translate }}
      </button>
      <button
        mat-menu-item
        [matTooltip]="'resourceEditor.propertiesDisplay.annotationToolbar.copyInternalLink' | translate"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="
          this.notification.openSnackBar(
            _translateService.instant('resourceEditor.propertiesDisplay.annotationToolbar.internalLinkCopied')
          )
        ">
        <mat-icon>content_copy</mat-icon>
        {{ 'resourceEditor.propertiesDisplay.annotationToolbar.copyInternalLinkToClipboard' | translate }}
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

  readonly _translateService = inject(TranslateService);

  constructor(
    protected notification: NotificationService,
    private readonly _regionService: RegionService,
    private readonly _resourceService: ResourceService,
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
