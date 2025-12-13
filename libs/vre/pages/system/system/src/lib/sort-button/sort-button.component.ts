import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

export interface SortProp {
  key: string;
  label: string;
}

/**
 * a component with a list of properties to sort a list by one of them.
 * It can be used together with the DspSortBy pipe.
 */
@Component({
  selector: 'app-sort-button',
  templateUrl: './sort-button.component.html',
  styleUrls: ['./sort-button.component.scss'],
  imports: [MatIcon, MatIconButton, MatMenu, MatMenuItem, MatMenuTrigger],
})
export class SortButtonComponent implements OnInit {
  @Input({ required: true }) sortProps!: SortProp[];
  @Input() position: 'left' | 'right' = 'left';
  @Input() icon = 'sort';
  @Input() activeKey?: string;

  @Output() sortKeyChange = new EventEmitter<string>();

  menuXPos: 'before' | 'after' = 'after';

  ngOnInit() {
    if (this.position === 'right') {
      this.menuXPos = 'before';
    }

    this.sortBy(this.activeKey ?? this.sortProps[0].key);
  }

  sortBy(key: string) {
    this.activeKey = key || this.sortProps[0].key;
    this.sortKeyChange.emit(this.activeKey);
  }
}
