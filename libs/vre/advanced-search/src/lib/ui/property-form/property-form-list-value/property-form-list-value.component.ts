import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListNodeV2, Constants } from '@dasch-swiss/dsp-js';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ListItemComponent } from './list-item/list-item.component';

@Component({
    selector: 'dasch-swiss-property-form-list-value',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatMenuModule, ListItemComponent],
    templateUrl: './property-form-list-value.component.html',
    styleUrls: ['./property-form-list-value.component.scss'],
})
export class PropertyFormListValueComponent {
    @Input() list: ListNodeV2 | undefined = undefined;

    @Output() emitValueChanged = new EventEmitter<string>();

    constants = Constants;

    selectedItem: string | undefined = undefined;

    listItems: ListNodeV2[] = [];

    onItemClicked(item: ListNodeV2) {
        this.selectedItem = item.label;
        this.emitValueChanged.emit(item.id);
    }

}
