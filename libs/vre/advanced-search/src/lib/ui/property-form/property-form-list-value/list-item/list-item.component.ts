import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { ListNodeV2 } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'dasch-swiss-list-item',
    standalone: true,
    imports: [CommonModule, MatMenuModule],
    templateUrl: './list-item.component.html',
    styleUrls: ['./list-item.component.scss'],
})
export class ListItemComponent {
    @Input() children: ListNodeV2[] = [];

    @Output() selectedNode: EventEmitter<ListNodeV2> =
        new EventEmitter<ListNodeV2>();

    @ViewChild('childMenu', { static: true }) public childMenu!: MatMenu;

    setValue(item: ListNodeV2) {
        this.selectedNode.emit(item);
    }
}
