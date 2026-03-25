import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Constants, ReadStillImageFileValue, ReadValue } from '@dasch-swiss/dsp-js';
import { filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { filter, map } from 'rxjs';
import { StillImageComponent } from '../representations/still-image/still-image.component';
import { VectorImageComponent } from '../representations/vector-image/vector-image.component';
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
        @if (incomingResource.res.properties[HasStillImageFileValue]; as imageValues) {
          @if (isVectorImage(imageValues[0])) {
            <app-vector-image [resource]="incomingResource.res" [compoundMode]="true" />
          } @else {
            <app-still-image [resource]="incomingResource.res" [compoundMode]="true" />
          }
        }
      }
    </app-resource-representation-container>
  `,
  imports: [
    AsyncPipe,
    ResourceLegalComponent,
    StillImageComponent,
    VectorImageComponent,
    ResourceRepresentationContainerComponent,
  ],
})
export class CompoundViewerComponent {
  HasStillImageFileValue = Constants.HasStillImageFileValue;

  fileValue$ = this.compoundService.incomingResource$.pipe(
    filterUndefined(),
    filter(value => !!value.res.properties[Constants.HasStillImageFileValue]?.length),
    map(value => {
      return value.res.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    })
  );

  constructor(public readonly compoundService: CompoundService) {}

  isVectorImage(value: ReadValue): boolean {
    return value.type === Constants.StillImageVectorFileValue;
  }
}
