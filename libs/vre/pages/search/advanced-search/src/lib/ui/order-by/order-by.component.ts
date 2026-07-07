import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderByItem, OrderDirection } from '../../model';
import { DerivedSearchStateService } from '../../service/derived-search-state.service';
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
import { getLabel } from '../../util/labels';

@Component({
  selector: 'app-order-by',
  imports: [AsyncPipe, MatButtonModule, MatIconModule, MatListModule, MatTooltipModule, OverlayModule],
  templateUrl: './order-by.component.html',
  styleUrls: ['./order-by.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderByComponent {
  readonly TOOLTIP_TEXT = 'Search cannot be ordered by a URI property or a property that links to a resource.';
  readonly getLabel = getLabel;
  private readonly _derivation = inject(DerivedSearchStateService);
  private readonly _urlSync = inject(SearchUrlSyncService);

  // Pure, URL-derived list: the active item reflects the `orderBy` param.
  orderByItems$ = this._derivation.orderByItems$;

  isOpen = false;

  activeLabel(items: OrderByItem[] | null): string | null {
    const active = items?.find(i => i.orderBy);
    return active ? getLabel(active.labels) || null : null;
  }

  /** Direction of the active sort, or null when no property is selected — drives the arrow on the trigger button. */
  activeDirection(items: OrderByItem[] | null): OrderDirection | null {
    return items?.find(i => i.orderBy)?.direction ?? null;
  }

  onSelectionChange(event: MatSelectionListChange) {
    // The URL's `orderBy` param holds a single active id. A selection toggles it on; deselecting the
    // active one clears it. Write straight to the URL — the derived `orderByItems$` reflects it back.
    const turnedOn = event.options.find(o => o.selected);
    this._writeOrderBy(turnedOn ? turnedOn.value.id : undefined);
  }

  removeOrderBy() {
    // The URL holds a single active id, so removing the active sort just clears it.
    this._writeOrderBy(undefined);
    this.isOpen = false;
  }

  toggleDirection(item: OrderByItem) {
    // Flip the active item's sort direction. `asc` is the default and stays out of the URL;
    // only `desc` is written (see SearchUrlSyncService). The derived list reflects it back.
    const direction = item.direction === 'desc' ? 'asc' : 'desc';
    this._urlSync.writeState({ orderBy: item.id, orderDir: direction }, { replaceUrl: false });
  }

  private _writeOrderBy(orderBy: string | undefined) {
    // Discrete user action ⇒ push a history entry (replaceUrl:false) so back/forward steps through it.
    // Clearing/changing the sort also drops any direction so it can't linger as an orphan param.
    this._urlSync.writeState({ orderBy, orderDir: undefined }, { replaceUrl: false });
  }
}
