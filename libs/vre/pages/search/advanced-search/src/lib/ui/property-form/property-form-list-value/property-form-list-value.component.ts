import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Constants, ListNodeV2 } from '@dasch-swiss/dsp-js';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';

@Component({
  selector: 'app-property-form-list-value',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  template: ` <mat-form-field appearance="fill" class="dropdown">
    <mat-label>Select a value</mat-label>
    <mat-select [(value)]="selectedItem" (selectionChange)="onSelectionChange($event)" panelClass="custom-select-panel">
      <mat-option *ngFor="let child of sortedLabelList; trackBy: trackByFn" [value]="child">
        {{ child.label }}
      </mat-option>
    </mat-select>
  </mat-form-field>`,
  styleUrls: ['./property-form-list-value.component.scss'],
})
export class PropertyFormListValueComponent implements AfterViewInit {
  @Input() list: ListNodeV2 | undefined = undefined;
  @Input() value: string | PropertyFormItem[] | undefined = undefined;

  @Output() emitValueChanged = new EventEmitter<string>();

  constants = Constants;

  selectedItem: ListNodeV2 | undefined = undefined;

  get sortedLabelList(): ListNodeV2[] | undefined {
    return this.list?.children.sort((a, b) => a.label.localeCompare(b.label));
  }

  ngAfterViewInit(): void {
    if (this.list && this.value && typeof this.value === 'string') {
      this.selectedItem = this.findItemById(this.list, this.value);
    }
  }

  trackByFn = (index: number, item: ListNodeV2) => `${index}-${item.id}`;

  onSelectionChange(event: any) {
    const selectedNode: ListNodeV2 = event.value;
    this.selectedItem = selectedNode;
    this.emitValueChanged.emit(selectedNode.id);
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
