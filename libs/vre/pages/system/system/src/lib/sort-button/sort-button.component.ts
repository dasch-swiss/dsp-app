import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AppError } from '@dasch-swiss/vre/core/error-handler';

export interface SortProp<K extends string = string> {
  key: K;
  label: string;
}

/**
 * a component with a list of properties to sort a list by one of them.
 * It can be used together with the DspSortBy pipe.
 */
@Component({
  selector: 'app-sort-button',
  template: `
    <button matButton="text" [matMenuTriggerFor]="sortSelection">
      <mat-icon>sort</mat-icon>
      Sort by{{ selectedLabel ? ': ' + selectedLabel : '' }}
    </button>

    <mat-menu #sortSelection="matMenu">
      @for (item of sortProps; track item) {
        <button mat-menu-item (click)="sortBy(item.key)" [class.active]="activeKey === item.key">
          {{ item.label }}
        </button>
      }
    </mat-menu>
  `,
  styleUrls: ['./sort-button.component.css'],
  imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatButton],
})
export class SortButtonComponent<K extends string = string> implements OnInit {
  @Input({ required: true }) sortProps!: SortProp<K>[];
  @Input() activeKey?: K;

  @Output() sortKeyChange = new EventEmitter<K>();

  selectedLabel?: string;

  ngOnInit() {
    this.sortBy(this.activeKey ?? this.sortProps[0].key);
  }

  sortBy(key: K) {
    const newSort = this.sortProps.find(prop => prop.key === key);
    if (!newSort) {
      throw new AppError(`Sort with key "${key}" not found`);
    }

    this.selectedLabel = newSort.label;
    this.sortKeyChange.emit(newSort.key);
  }
}
