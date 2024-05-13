import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, race } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class ResourceClassIriService {
  project$ = this._store.select(ProjectsSelectors.currentProject);

  ontoId$ = this.project$.pipe(
    filter(project => project !== undefined),
    map(project => {
      const iriBase = this._ontologyService.getIriBaseUrl();
      const ontologyName = this._route.snapshot.params[RouteConstants.ontoParameter];
      return `${iriBase}/ontology/${project.shortcode}/${ontologyName}/v2`;
    })
  );

  resourceClassIri$ = this.ontoId$.pipe(
    map(ontoId => {
      const className = this._route.snapshot.params[RouteConstants.classParameter];
      return `${ontoId}#${className}`;
    })
  );

  resourceClassIriFromRoute$ = this._route.params.pipe(
    filter(params => params[RouteConstants.resourceParameter] !== undefined),
    switchMap(params =>
      this._dspApiConnection.v2.res.getResource(
        this._resourceService.getResourceIri(
          params[RouteConstants.projectParameter],
          params[RouteConstants.resourceParameter]
        )
      )
    ),
    map(v => Object.values((v as ReadResource).entityInfo.classes)[0].id)
  );

  resourceClassIriFromParamSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private _store: Store,
    private _route: ActivatedRoute,
    private _ontologyService: OntologyService,
    private _resourceService: ResourceService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {
    race([this.resourceClassIriFromRoute$, this.resourceClassIri$])
      .pipe(take(1))
      .subscribe(v => {
        this.resourceClassIriFromParamSubject.next(v);
      });
  }
}
