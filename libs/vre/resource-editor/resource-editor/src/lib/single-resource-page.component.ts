import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { map } from 'rxjs';

@Component({
  selector: 'app-single-resource-page',
  template: `
    <app-centered-layout>
      @if (resourceIri$ | async; as resourceIri) {
        <app-resource-fetcher [resourceIri]="resourceIri" />
      }
    </app-centered-layout>
  `,
})
export class SingleResourcePageComponent {
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
