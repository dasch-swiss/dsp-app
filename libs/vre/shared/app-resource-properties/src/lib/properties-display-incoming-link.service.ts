import { Injectable } from '@angular/core';
import { ReadResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { sortByKeys } from './sortByKeys';

@Injectable()
export class PropertiesDisplayIncomingLinkService {
  constructor(private _incomingService: IncomingService) {}

  searchIncomingLinks$ = (resourceId: string, offset: number) =>
    this._incomingService.getIncomingLinksForResource(resourceId, offset).pipe(shareReplay());

  getIncomingLinks$(searchResults$: Observable<ReadResourceSequence>): Observable<IncomingOrStandoffLink[]> {
    return searchResults$.pipe(
      map(incomingResources => {
        const array = (incomingResources as ReadResourceSequence).resources.map(resource => {
          return this._createIncomingOrStandoffLink(resource);
        });

        return sortByKeys(array, ['project', 'label']);
      })
    );
  }

  mayHaveMoreResults$ = (searchResults$: Observable<ReadResourceSequence>): Observable<boolean> =>
    searchResults$.pipe(map(incomingResources => (incomingResources as ReadResourceSequence).mayHaveMoreResults));

  private _createIncomingOrStandoffLink(resource: ReadResource): IncomingOrStandoffLink {
    const resourceIdPathOnly = resource.id.match(/[^\/]*\/[^\/]*$/);
    if (!resourceIdPathOnly) {
      throw new Error('Resource id is not in the expected format');
    }

    return {
      label: resource.label,
      uri: `/resource/${resourceIdPathOnly[0]}`,
      project: resource.resourceClassLabel ? resource.resourceClassLabel : '',
    };
  }
}
