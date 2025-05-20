import { Component } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <ng-container *ngIf="compoundService.incomingResource$ | async as incomingResource">
      <app-resource-legal [resource]="incomingResource.res" />

      <app-still-image
        *ngIf="incomingResource.res.properties[HasStillImageFileValue]"
        class="dsp-representation"
        [resource]="incomingResource.res"
        [compoundMode]="true" />
    </ng-container>
  `,
})
export class CompoundViewerComponent {
  HasStillImageFileValue = Constants.HasStillImageFileValue;

  constructor(public compoundService: CompoundService) {}
}
