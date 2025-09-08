import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';

@Component({
  selector: 'app-resource-toolbar',
  template: `
    <span class="action">
      <button
        mat-icon-button
        matTooltip="Open resource in new tab"
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
        matTooltip="Share resource: {{ resource.versionArkUrl }}"
        matTooltipPosition="above"
        [matMenuTriggerFor]="share">
        <mat-icon>share</mat-icon>
      </button>

      <app-permission-info [resource]="resource" />
      @if (userCanDelete$ | async) {
        <app-resource-edit-more-menu [resource]="resource" />
      }
    </span>

    <mat-menu #share="matMenu" class="res-share-menu">
      <button
        mat-menu-item
        matTooltip="Copy ARK url"
        matTooltipPosition="above"
        data-cy="copy-ark-url-button"
        [cdkCopyToClipboard]="resource.versionArkUrl"
        (click)="notification.openSnackBar('ARK URL copied to clipboard!')">
        <mat-icon>content_copy</mat-icon>
        Copy ARK url to clipboard
      </button>
      <button
        mat-menu-item
        matTooltip="Copy internal link"
        data-cy="copy-internal-link-button"
        matTooltipPosition="above"
        [cdkCopyToClipboard]="resource.id"
        (click)="notification.openSnackBar('Internal link copied to clipboard!')">
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
export class ResourceToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;

  userCanDelete$ = this._resourceFetcherService.userCanDelete$;

  constructor(
    protected notification: NotificationService,
    private _resourceService: ResourceService,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  openResource() {
    window.open(`/resource${this._resourceService.getResourcePath(this.resource.id)}`, '_blank');
  }
}
