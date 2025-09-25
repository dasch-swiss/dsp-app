import { Component, Input, OnInit } from '@angular/core';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-arrow-navigation',
  template: `
    <div style="height: 100%; display:flex; align-items: center; cursor: pointer">
      <button
        mat-button
        [disabled]="forwardNavigation ? compoundNavigation?.isLastPage : compoundNavigation.page <= 1"
        (click)="compoundService.openPage(compoundNavigation.page + (forwardNavigation ? 1 : -1))"
        style="height: 100%; color: white">
        <mat-icon>keyboard_arrow_{{ forwardNavigation ? 'right' : 'left' }}</mat-icon>
      </button>
    </div>
  `,
  styles: ['button[disabled] {color: #b8b8b8!important}'],
  standalone: false,
})
export class CompoundArrowNavigationComponent implements OnInit {
  @Input() forwardNavigation!: boolean;

  get compoundNavigation() {
    return this.compoundService.compoundPosition!;
  }

  ngOnInit() {
    if (!this.compoundService.compoundPosition) {
      throw new AppError('Compound position is not set');
    }
  }

  constructor(public compoundService: CompoundService) {}
}
