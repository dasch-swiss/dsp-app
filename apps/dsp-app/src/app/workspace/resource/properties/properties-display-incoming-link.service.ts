import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingLink, IncomingService } from '@dasch-swiss/vre/shared/app-resource-properties';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PropertiesDisplayIncomingLinkService {
  resource: DspResource;

  constructor(private _incomingService: IncomingService) {}

  getIncomingLinks$(resourceId: string, offset: number): Observable<IncomingLink[]> {
    return this._incomingService.getIncomingLinksForResource(resourceId, offset).pipe(
      map(incomingResources => {
        return (incomingResources as ReadResourceSequence).resources.map(resource => {
          return {
            label: resource.label,
            uri: `/resource/${resource.id.match(/[^\/]*\/[^\/]*$/)[0]}`,
            project: resource.resourceClassLabel,
          };
        });
      })
    );
  }
}
