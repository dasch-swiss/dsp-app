import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderByItem } from '../../data-access/advanced-search-store/advanced-search-store.service';
import {
    MatListModule,
    MatSelectionList,
    MatSelectionListChange,
} from '@angular/material/list';
import {
    CdkDragDrop,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'dasch-swiss-order-by',
    standalone: true,
    imports: [
        CommonModule,
        CdkDrag,
        CdkDragHandle,
        CdkDropList,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule,
        OverlayModule,
    ],
    templateUrl: './order-by.component.html',
    styleUrls: ['./order-by.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderByComponent {
    @Input() orderByList: OrderByItem[] | null = [];
    @Input() orderByDisabled: boolean | null = false;

    @Output() emitPropertyOrderByChanged = new EventEmitter<OrderByItem[]>();

    @ViewChild('sortOrderSelectionList')
    sortOrderSelectionList!: MatSelectionList;

    isOpen = false;
    tooltipText = 'Search cannot be ordered by a URI property or a property that links to a resource.';

    drop(event: CdkDragDrop<string[]>) {
        if (!this.orderByList) return;

        moveItemInArray(
            this.orderByList,
            event.previousIndex,
            event.currentIndex
        );

        this.emitPropertyOrderByChanged.emit(this.orderByList);
    }

    onSelectionChange(event: MatSelectionListChange) {
        if (!this.orderByList) return;

        event.options.forEach((option) => {
            const selectedItem = this.orderByList?.find(
                (item) => item.id === option.value
            );
            if (selectedItem) {
                selectedItem.orderBy = option.selected;
            }
        });

        this.emitPropertyOrderByChanged.emit(this.orderByList);
    }
}
