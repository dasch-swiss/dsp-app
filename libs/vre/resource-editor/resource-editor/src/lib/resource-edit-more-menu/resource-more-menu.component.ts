import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-resource-more-menu',
  template: `
    @if (resourceFetcher.userCanDelete$ | async) {
      <button
        data-cy="resource-toolbar-more-button"
        color="primary"
        mat-icon-button
        class="more-menu"
        [matTooltip]="'resourceEditor.moreMenu.more' | translate"
        matTooltipPosition="above"
        [matMenuTriggerFor]="more">
        <mat-icon>more_vert</mat-icon>
      </button>

      <mat-menu #more="matMenu" class="res-more-menu">
        <app-delete-menu-items
          [resource]="resource"
          (resourceDeleted)="resourceDeleted.emit()"
          (resourceErased)="resourceErased.emit()" />
      </mat-menu>
    }
  `,
  styles: [
    `
      .more-menu {
        border-radius: 0;
      }
    `,
  ],
  standalone: false,
})
export class ResourceMoreMenuComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Output() resourceDeleted = new EventEmitter<void>();
  @Output() resourceErased = new EventEmitter<void>();

  protected readonly resourceFetcher = inject(ResourceFetcherService);
}
