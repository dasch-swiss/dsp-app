import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { DeleteMenuItemsComponent } from './delete-menu-items.component';
import { EditLabelMenuItemComponent } from './edit-label-menu-item.component';

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
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
    DeleteMenuItemsComponent,
    EditLabelMenuItemComponent,
  ],
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
