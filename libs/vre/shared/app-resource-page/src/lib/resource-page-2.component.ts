import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { map } from 'rxjs/operators';

/** TODO: This component resourcePage2 is the same as resourcePage, but with different routing parameters.
 * This routing issue should be addressed and refactor in order to remove those duplicated components.
 */
@Component({
  selector: 'app-resource-page-2',
  template:
    '<app-resource-fetcher *ngIf="resourceIri$ | async as resourceIri" [resourceIri]="resourceIri"></app-resource-fetcher>',
})
export class ResourcePage2Component {
  resourceIri$ = this._route.params.pipe(
    map(params => {
      const projectCode = params['project'];
      const resourceUuid = params['resource'];
      if (projectCode && resourceUuid) {
        return this._resourceService.getResourceIri(projectCode, resourceUuid);
      }
      return undefined;
    })
  );

  constructor(
    private _route: ActivatedRoute,
    private _resourceService: ResourceService
  ) {}
}
