import { Component } from '@angular/core';
import { FileRepresentation, getFileValue } from '@dasch-swiss/vre/shared/app-representations';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <ng-container *ngIf="compoundService.compoundPosition">
      <app-still-image
        class="dsp-representation stillimage"
        *ngIf="compoundService.incomingResource as incomingResource"
        [resource]="incomingResource">
        <div navigationArrows class="arrows">
          <app-compound-arrow-navigation [forwardNavigation]="false" class="arrow" />
          <app-compound-arrow-navigation [forwardNavigation]="true" class="arrow" />
        </div>
        <app-compound-navigation navigation />
        <app-compound-slider slider />
      </app-still-image>
    </ng-container>
  `,
  styles: [
    `
      .arrow {
        position: absolute;
        z-index: 1;
        height: 100%;

        &:first-child {
          left: 0;
        }

        &:nth-child(2) {
          right: 0;
        }
      }
    `,
  ],
})
export class CompoundViewerComponent {
  get fileRepresentation() {
    return new FileRepresentation(getFileValue(this.compoundService.incomingResource!)!);
  }

  constructor(public compoundService: CompoundService) {}
}
