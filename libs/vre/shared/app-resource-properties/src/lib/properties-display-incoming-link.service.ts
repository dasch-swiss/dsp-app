import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { sortByKeys } from './sortByKeys';

@Injectable()
export class PropertiesDisplayIncomingLinkService {
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
