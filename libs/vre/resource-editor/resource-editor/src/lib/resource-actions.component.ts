import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Constants, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PermissionInfoComponent } from './permission-info/permission-info.component';

@Component({
  selector: 'app-resource-actions',
  template: `
    <span class="action">
      <a
        mat-icon-button
        [matTooltip]="'resourceEditor.toolbar.openInNewTab' | translate"
        color="primary"
        data-cy="open-in-new-window-button"
        matTooltipPosition="above"
        [routerLink]="getResourceLink()"
        [queryParams]="getResourceQueryParams()"
        target="_blank">
        <mat-icon>open_in_new</mat-icon>
      </a>
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
  standalone: true,
  imports: [
    ClipboardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    TranslateModule,
    PermissionInfoComponent,
  ],
})
export class ResourceActionsComponent {
  @Input({ required: true }) resource!: ReadResource;

  protected readonly _translateService = inject(TranslateService);

  constructor(
    protected notification: NotificationService,
    private readonly _resourceService: ResourceService
  ) {}

  getResourceLink(): string[] {
    let resourceId = this.resource.id;
    if (this.resource.entityInfo.classes[Constants.Region]) {
      const linkedResource = this.resource.getValues(Constants.IsRegionOfValue)[0] as ReadLinkValue | undefined;
      resourceId = linkedResource?.linkedResourceIri || resourceId;
    }
    const resPath = this._resourceService.getResourcePath(resourceId);
    const resourcePath = resPath.split('/').filter(segment => segment);
    return ['/', RouteConstants.resource, ...resourcePath];
  }

  getResourceQueryParams(): Record<string, string> | null {
    if (this.resource.entityInfo.classes[Constants.Region]) {
      const annotationId = encodeURIComponent(this.resource.id);
      return { [RouteConstants.annotationQueryParam]: annotationId };
    }
    return null;
  }
}
