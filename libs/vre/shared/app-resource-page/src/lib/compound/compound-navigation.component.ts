import { Component } from '@angular/core';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-navigation',
  template: ` <span style="display: flex; align-items: center">
    <button mat-icon-button [disabled]="compoundNavigation.page <= 1" matTooltip="First page" (click)="openPage(1)">
      <mat-icon>first_page</mat-icon>
    </button>
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page <= 1"
      matTooltip="Previous page"
      (click)="openPage(compoundNavigation.page - 1)">
      <mat-icon>navigate_before</mat-icon>
    </button>
    <span class="range">{{ compoundNavigation.page }} of {{ compoundNavigation.totalPages }}</span>
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page >= compoundNavigation.totalPages"
      matTooltip="Next page"
      (click)="openPage(compoundNavigation.page + 1)">
      <mat-icon>navigate_next</mat-icon>
    </button>
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page === compoundNavigation.totalPages"
      matTooltip="Last page"
      (click)="openPage(compoundNavigation.totalPages)">
      <mat-icon>last_page</mat-icon>
    </button>
  </span>`,
})
export class CompoundNavigationComponent {
  get compoundNavigation() {
    return this.compoundService.compoundPosition;
  }

  openPage(page: number) {
    this.compoundService.openPage(page);
  }

  constructor(public compoundService: CompoundService) {}
}
