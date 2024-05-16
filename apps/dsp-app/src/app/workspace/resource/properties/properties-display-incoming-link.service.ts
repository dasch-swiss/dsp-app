import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingOrStandoffLink, IncomingService, sortByKeys } from '@dasch-swiss/vre/shared/app-resource-properties';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PropertiesDisplayIncomingLinkService {
  resource: DspResource;

  constructor(private _incomingService: IncomingService) {}

  getIncomingLinks$(resourceId: string, offset: number): Observable<IncomingOrStandoffLink[]> {
    return this._incomingService.getIncomingLinksForResource(resourceId, offset).pipe(
      map(incomingResources => {
        const array = (incomingResources as ReadResourceSequence).resources.map(resource => {
          return {
            label: resource.label,
            uri: `/resource/${resource.id.match(/[^\/]*\/[^\/]*$/)[0]}`,
            project: resource.resourceClassLabel,
          };
        });

        return sortByKeys(array, ['project', 'label']);
      })
    );
  }
}
