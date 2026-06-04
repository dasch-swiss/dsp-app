import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderByItem } from '../../model';
import { OrderByService } from '../../service/order-by.service';

@Component({
  selector: 'app-order-by',
  imports: [AsyncPipe, MatButtonModule, MatIconModule, MatListModule, MatTooltipModule, OverlayModule],
  templateUrl: './order-by.component.html',
  styleUrls: ['./order-by.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderByComponent {
  readonly TOOLTIP_TEXT = 'Search cannot be ordered by a URI property or a property that links to a resource.';
  private orderByService: OrderByService = inject(OrderByService);

  orderByItems$ = this.orderByService.orderByItems$;

  isOpen = false;

  activeLabel(items: OrderByItem[] | null): string | null {
    return items?.find(i => i.orderBy)?.label ?? null;
  }

  onSelectionChange(event: MatSelectionListChange) {
    const currentOrderByList = this.orderByService.currentOrderBy;
    event.options.forEach(option => {
      const selectedItem = currentOrderByList.find(item => item.id === option.value.id);
      if (selectedItem) {
        selectedItem.orderBy = option.selected;
      }
    });
    this.orderByService.updateOrderBy(currentOrderByList);
  }

  removeOrderBy(item: OrderByItem) {
    const currentOrderByList = this.orderByService.currentOrderBy;
    const target = currentOrderByList.find(i => i.id === item.id);
    if (target) {
      target.orderBy = false;
      this.orderByService.updateOrderBy(currentOrderByList);
    }
    this.isOpen = false;
  }
}
