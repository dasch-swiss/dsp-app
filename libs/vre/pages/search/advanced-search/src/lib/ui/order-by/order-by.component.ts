import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderByItem } from '../../model';
import { OrderByService } from '../../service/order-by.service';
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
  private orderByService: OrderByService = inject(OrderByService);

  orderByItems$ = this.orderByService.orderByItems$;

  isOpen = false;

  activeLabel(items: OrderByItem[] | null): string | null {
    const active = items?.find(i => i.orderBy);
    return active ? getLabel(active.labels) || null : null;
  }

  onSelectionChange(event: MatSelectionListChange) {
    // Produce new item references so `orderByItems$` emits (see OrderByItem — items are immutable).
    const selected = new Map(event.options.map(o => [o.value.id, o.selected]));
    const next = this.orderByService.currentOrderBy.map(item =>
      selected.has(item.id) ? item.withOrderBy(selected.get(item.id)!) : item
    );
    this.orderByService.updateOrderBy(next);
  }

  removeOrderBy(item: OrderByItem) {
    const next = this.orderByService.currentOrderBy.map(i => (i.id === item.id ? i.withOrderBy(false) : i));
    this.orderByService.updateOrderBy(next);
    this.isOpen = false;
  }
}
