import { Component } from '@angular/core';
import { Constants, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { map } from 'rxjs';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <ng-container *ngIf="compoundService.incomingResource$ | async as incomingResource">
      <app-resource-legal *ngIf="fileValue$ | async as fileValue" [fileValue]="fileValue" />

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

  fileValue$ = this.compoundService.incomingResource$.pipe(
    filterUndefined(),
    map(value => {
      return value.res.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    })
  );

  constructor(public compoundService: CompoundService) {}
}
