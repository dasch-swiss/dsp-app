import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { combineLatest, map } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';

@Component({
  selector: 'app-incoming-resource-more-menu',
  template: `
    @if (shouldShowMenu$ | async) {
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
        @if (resourceFetcher.userCanEdit$ | async) {
          <app-edit-label-menu-item [resource]="resource" (resourceUpdated)="resourceUpdated.emit()" />
        }

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
export class IncomingResourceMoreMenuComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Output() resourceDeleted = new EventEmitter<void>();
  @Output() resourceErased = new EventEmitter<void>();
  @Output() resourceUpdated = new EventEmitter<void>();

  protected readonly resourceFetcher = inject(ResourceFetcherService);

  protected readonly shouldShowMenu$ = combineLatest([
    this.resourceFetcher.userCanEdit$,
    this.resourceFetcher.userCanDelete$,
  ]).pipe(map(([canEdit, canDelete]) => canEdit || canDelete));
}
