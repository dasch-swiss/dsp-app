import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ListNodeV2, Constants } from '@dasch-swiss/dsp-js';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';
import { ListItemComponent } from './list-item/list-item.component';

@Component({
  selector: 'dasch-swiss-property-form-list-value',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ListItemComponent,
  ],
  templateUrl: './property-form-list-value.component.html',
  styleUrls: ['./property-form-list-value.component.scss'],
})
export class PropertyFormListValueComponent implements AfterViewInit {
  @Input() list: ListNodeV2 | undefined = undefined;
  @Input() value: string | PropertyFormItem[] | undefined = undefined;

  @Output() emitValueChanged = new EventEmitter<string>();

  constants = Constants;

  selectedItem: string | undefined = undefined;

  ngAfterViewInit(): void {
    if (this.list && this.value && typeof this.value === 'string') {
      this.selectedItem = this.findItemById(this.list, this.value)?.label;
    }
  }

  onItemClicked(item: ListNodeV2) {
    this.selectedItem = item.label;
    this.emitValueChanged.emit(item.id);
  }

  findItemById(node: ListNodeV2, targetId: string): ListNodeV2 | undefined {
    if (node.id === targetId) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findItemById(child, targetId);
      if (found) {
        return found;
      }
    }

    return undefined;
  }
}
