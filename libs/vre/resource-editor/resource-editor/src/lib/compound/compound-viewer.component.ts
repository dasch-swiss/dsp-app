import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Constants, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { map } from 'rxjs';
import { StillImageComponent } from '../representations/still-image/still-image.component';
import { ResourceLegalComponent } from '../resource-legal.component';
import { ResourceRepresentationContainerComponent } from '../resource-representation-container.component';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <app-resource-representation-container>
      @if (compoundService.incomingResource$ | async; as incomingResource) {
        @if (fileValue$ | async; as fileValue) {
          <app-resource-legal [fileValue]="fileValue" />
        }
        @if (incomingResource.res.properties[HasStillImageFileValue]) {
          <app-still-image [resource]="incomingResource.res" [compoundMode]="true" />
        }
      }
    </app-resource-representation-container>
  `,
  imports: [AsyncPipe, ResourceLegalComponent, StillImageComponent, ResourceRepresentationContainerComponent],
})
export class CompoundViewerComponent {
  HasStillImageFileValue = Constants.HasStillImageFileValue;

  fileValue$ = this.compoundService.incomingResource$.pipe(
    filterUndefined(),
    map(value => {
      return value.res.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    })
  );

  constructor(public readonly compoundService: CompoundService) {}
}
