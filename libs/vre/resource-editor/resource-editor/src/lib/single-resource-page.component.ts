import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { CenteredLayoutComponent } from '@dasch-swiss/vre/ui/ui';
import { map } from 'rxjs';
import { ResourceFetcherComponent } from './resource-fetcher.component';

@Component({
  selector: 'app-single-resource-page',
  template: `
    <app-centered-layout>
      @if (resourceIri$ | async; as resourceIri) {
        <app-resource-fetcher [resourceIri]="resourceIri" />
      }
    </app-centered-layout>
  `,
  imports: [AsyncPipe, CenteredLayoutComponent, ResourceFetcherComponent],
})
export class SingleResourcePageComponent {
  resourceIri$ = this._route.params.pipe(
    map(params => {
      const projectCode = params['project'];
      const resourceUuid = params['resource'];
      // TEMP DEBUG (DEV-6568): trace routing -> resourceIri.
      // eslint-disable-next-line no-console
      console.warn(
        `[DEV-6568] (1) SingleResourcePage route params project=${JSON.stringify(projectCode)} resource=${JSON.stringify(
          resourceUuid
        )}`
      );
      if (projectCode && resourceUuid) {
        const iri = this._resourceService.getResourceIri(projectCode, resourceUuid);
        // eslint-disable-next-line no-console
        console.warn(`[DEV-6568] (2) SingleResourcePage resolved resourceIri=${JSON.stringify(iri)}`);
        return iri;
      }
      // eslint-disable-next-line no-console
      console.warn('[DEV-6568] (2) SingleResourcePage no project/resource in params -> undefined');
      return undefined;
    })
  );

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _resourceService: ResourceService
  ) {}
}
