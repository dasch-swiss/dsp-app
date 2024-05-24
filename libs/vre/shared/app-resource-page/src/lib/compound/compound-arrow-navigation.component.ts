import { Component, Input } from '@angular/core';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-arrow-navigation',
  template: ` <div style="height: 100%; display:flex; align-items: center; cursor: pointer">
    <button
      mat-button
      [disabled]="
        forwardNavigation ? compoundNavigation.page >= compoundNavigation.totalPages : compoundNavigation.page <= 1
      "
      (click)="openPage(compoundNavigation.page + (forwardNavigation ? 1 : -1))"
      style="height: 100%; color: white">
      <mat-icon>keyboard_arrow_{{ forwardNavigation ? 'right' : 'left' }}</mat-icon>
    </button>
  </div>`,
  styles: ['button[disabled] {color: #b8b8b8!important}'],
})
export class CompoundArrowNavigationComponent {
  @Input() forwardNavigation!: boolean;

  get compoundNavigation() {
    return this.compoundService.compoundPosition;
  }

  openPage(page: number) {
    this.compoundService.openPage(page);
  }

  constructor(public compoundService: CompoundService) {}
}
