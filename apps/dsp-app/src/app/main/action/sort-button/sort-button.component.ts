import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
})
export class SortButtonComponent implements OnInit {
  /**
   * @param sortProps[]
   * An array of SortProp objects for the selection menu:
   * SortProp: { key: string, label: string }
   */
  @Input() sortProps: SortProp[];

  /**
   * @param position string
   * Optional position of the sort menu: right or left
   * e.g. [position='left']
   */
  @Input() position: 'left' | 'right' = 'left';

  /**
   * @param icon
   * Default icon is "sort" from material design.
   * But you can replace it with another one
   * e.g. sort_by_alpha
   */
  @Input() icon = 'sort';

  /**
   * @param activeKey
   * Optional parameter: selected sort property key
   * By default it takes the first key from sortProps
   */
  @Input() activeKey?: string;

  /**
   * @emits {string} sortKeyChange
   *
   * EventEmitter when a user selected a sort property;
   * This is the selected key
   */
  @Output() sortKeyChange: EventEmitter<string> = new EventEmitter<string>();

  menuXPos: 'before' | 'after' = 'after';

  ngOnInit() {
    if (this.position === 'right') {
      this.menuXPos = 'before';
    }

    this.sortBy(this.activeKey);
  }

  /**
   * @param key a string to sort by
   */
  sortBy(key: string) {
    this.activeKey = key ? key : this.sortProps[0].key;
    this.sortKeyChange.emit(this.activeKey);
  }
}
