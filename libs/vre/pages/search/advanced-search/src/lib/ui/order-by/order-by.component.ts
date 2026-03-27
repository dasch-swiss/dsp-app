import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderByService } from '../../service/order-by.service';

@Component({
  selector: 'app-order-by',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    OverlayModule,
    AsyncPipe,
  ],
  templateUrl: './order-by.component.html',
  styleUrls: ['./order-by.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderByComponent {
  readonly TOOLTIP_TEXT = 'Search cannot be ordered by a URI property or a property that links to a resource.';
  private orderByService: OrderByService = inject(OrderByService);

  orderByItems$ = this.orderByService.orderByItems$;

  isOpen = false;

  drop(event: CdkDragDrop<string[]>) {
    const orderBy = this.orderByService.currentOrderBy;
    moveItemInArray(orderBy, event.previousIndex, event.currentIndex);
    this.orderByService.updateOrderBy(orderBy);
  }

  onSelectionChange(event: MatSelectionListChange) {
    const currentOrderByList = this.orderByService.currentOrderBy;
    event.options.forEach(option => {
      const selectedItem = currentOrderByList.find(item => item.id === option.value);
      if (selectedItem) {
        selectedItem.orderBy = option.selected;
      }
    });
    this.orderByService.updateOrderBy(currentOrderByList);
  }
}
