import { Component } from '@angular/core';
import { Constants, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { map } from 'rxjs';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    @if (compoundService.incomingResource$ | async; as incomingResource) {
      @if (fileValue$ | async; as fileValue) {
        <app-resource-legal [fileValue]="fileValue" />
      }
      @if (incomingResource.res.properties[HasStillImageFileValue]) {
        <app-still-image class="dsp-representation" [resource]="incomingResource.res" [compoundMode]="true" />
      }
    }
  `,
  standalone: false,
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
