import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-selected-resources',
  templateUrl: './selected-resources.component.html',
  styleUrls: ['./selected-resources.component.scss'],
})
export class SelectedResourcesComponent {
  // total number of resources selected
  @Input() resCount: number;

  // list of selected resources ids
  @Input() resIds: string[];

  // return selected actions and other info if any
  @Output() actionType: EventEmitter<string> = new EventEmitter<string>();

  // actions which can be applied on selected resources
  resourceAction: 'compare' | 'edit' | 'delete' | 'starred' | 'cancel';

  // return compare action
  compareResources() {
    this.resourceAction = 'compare';
    this.actionType.emit(this.resourceAction);
  }

  // cancel action
  cancelSelection() {
    this.resourceAction = 'cancel';
    this.actionType.emit(this.resourceAction);
  }
}
