import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, filter, first, map, Observable, of, startWith, switchMap } from 'rxjs';
import { DATA_CLASS_PARAM } from '../../data-class-url-state.service';
import { ProjectPageService } from '../../project-page.service';

/** The IRI of the class the data browser shows, after every navigation; `undefined` when it shows none. */
export function selectedResourceClassIri$(
  router: Router,
  route: ActivatedRoute,
  ontologyService: OntologyService,
  projectPageService: ProjectPageService
): Observable<string | undefined> {
  return router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    switchMap(() => {
      const firstChild = route.firstChild;
      if (!firstChild) {
        return of(undefined);
      }
      return combineLatest([firstChild.params, projectPageService.currentProject$.pipe(first())]).pipe(
        map(([params, project]) =>
          ontologyService.getClassIdFromParams(
            project.shortcode,
            params[RouteConstants.ontologyParameter],
            params[RouteConstants.classParameter]
          )
        )
      );
    })
  );
}

/** Opens a class in the data browser; `route` is the data browser page's route. */
export function navigateToResourceClass(router: Router, route: ActivatedRoute, iri: string): void {
  const [ontologyIri, className] = iri.split('#');
  const ontologyName = OntologyService.getOntologyNameFromIri(ontologyIri);

  // Only `view` carries across a class switch; naming the params replaces the rest (filters, term
  // and sort belong to the class being left). Read off the router's URL: the sidenav sits outside
  // the class view that owns the state service.
  const view = router.routerState.snapshot.root.queryParamMap.get(DATA_CLASS_PARAM.view);

  router.navigate([ontologyName, className], {
    relativeTo: route,
    queryParams: { [DATA_CLASS_PARAM.view]: view },
  });
}
