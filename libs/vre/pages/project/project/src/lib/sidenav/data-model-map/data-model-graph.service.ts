import { inject, Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { APIV3ApiService, OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { catchError, combineLatest, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { buildDataModelGraph, DataModelGraph } from './data-model-graph';

/** The current project's data models, with their resource counts, and the graph of each, keyed by ontology IRI. */
@Injectable({ providedIn: 'root' })
export class DataModelGraphService {
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _v3 = inject(APIV3ApiService);
  private readonly _dspApiConnection = inject(DspApiConnectionToken);
  private readonly _localizationService = inject(LocalizationService);

  /** Every data model of the current project with its classes and resource counts. */
  readonly projectOntologies$: Observable<OntologyAndResourceClasses[]> = this._projectPageService.currentProject$.pipe(
    switchMap(project =>
      this._v3.getV3ProjectsProjectiriResourcesperontology(project.id).pipe(
        catchError(error => {
          console.error('Error loading project ontologies:', error);
          return of([]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /** knora-api declares the built-in links, such as `isPartOf`; it never changes, so the cached copy is fine. */
  private readonly _knoraApi$ = this._dspApiConnection.v2.ontologyCache
    .getOntology(Constants.KnoraApiV2)
    .pipe(map(ontologies => [...ontologies.values()]));

  /** The graph of each data model, in the current language. */
  readonly graphs$: Observable<Map<string, DataModelGraph>> = combineLatest([
    this.projectOntologies$,
    this._projectPageService.ontologies$,
    this._knoraApi$,
    this._localizationService.currentLanguage$,
  ]).pipe(
    map(
      ([projectOntologies, definitions, knoraApi, language]) =>
        new Map(
          projectOntologies.map(ontology => [
            ontology.ontology.iri,
            buildDataModelGraph(ontology, projectOntologies, [...definitions, ...knoraApi], labels =>
              pickPreferredLanguageString(labels, language)
            ),
          ])
        )
    ),
    catchError(error => {
      // The class list and the class view still work; the maps are an aid and stay away.
      console.error('Error loading the data model graphs:', error);
      return of(new Map<string, DataModelGraph>());
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /** The graph of the data model `classIri` belongs to, if any. */
  graphOfClass$(classIri: string): Observable<DataModelGraph | undefined> {
    return this.graphs$.pipe(
      map(graphs =>
        [...graphs.values()].find(graph => graph.nodes.some(node => node.kind === 'class' && node.id === classIri))
      )
    );
  }
}
