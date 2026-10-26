import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, filter, map, Observable, switchMap } from 'rxjs';
import { IriLabelPair, Predicate, StatementElement } from '../model';
import { SearchFilterState } from '../search-filter-state';
import { buildStatementsFromFilterParams } from '../util/build-statements';
import { OntologyDataService } from './ontology-data.service';

/** The confirmed filter tree, hydrated against the loaded ontology. */
export interface ConfirmedSearchState {
  resourceClass: IriLabelPair | null;
  statements: StatementElement[];
}

/**
 * Hydrates the host page's stored filter state against the loaded ontology (predicates, statement tree) and
 * owns the ontology-switch reaction.
 */
@Injectable()
export class ConfirmedSearchStateService {
  private readonly _state = inject(SearchFilterState);
  private readonly _ontology = inject(OntologyDataService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this._reactToOntologyChange();
  }

  /**
   * Keeps the loaded ontology in sync with the host's value: non-empty names the ontology to load, empty (e.g.
   * after Reset) falls back to the project default. De-duped on the incoming value plus an identity guard
   * against the loaded ontology, so an unchanged target never reloads.
   */
  private _reactToOntologyChange(): void {
    this._state.ontologyIri$
      .pipe(
        distinctUntilChanged(),
        map(ontologyIri => ontologyIri || this._ontology.defaultOntologyIri),
        filter(
          (ontologyIri): ontologyIri is string => !!ontologyIri && ontologyIri !== this._ontology.selectedOntology.iri
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(ontologyIri => this._ontology.setOntology(ontologyIri));
  }

  /** Hydrated confirmed state, emitted only once the ontology sources needed for it are ready. */
  readonly confirmedState$: Observable<ConfirmedSearchState> = combineLatest([
    this._state.filters$,
    this._state.resourceClassIri$,
  ]).pipe(
    switchMap(([filters, resourceClassIri]) =>
      combineLatest([this._ontology.resourceClasses$, this._ontology.getProperties$()]).pipe(
        // Wait until the sources needed for THIS state are ready, then hydrate once.
        map(([classes, predicates]) => ({ classes, predicates })),
        distinctUntilChanged((a, b) => a.classes === b.classes && a.predicates === b.predicates),
        map(({ classes, predicates }) => this._hydrate(filters, resourceClassIri, classes, predicates))
      )
    )
  );

  private _hydrate(
    filters: Parameters<typeof buildStatementsFromFilterParams>[0],
    resourceClassIri: string | undefined,
    classes: IriLabelPair[],
    predicates: Predicate[]
  ): ConfirmedSearchState {
    const resourceClass = resourceClassIri ? (classes.find(c => c.iri === resourceClassIri) ?? null) : null;
    const statements = filters.length ? buildStatementsFromFilterParams(filters, predicates) : [];
    return { resourceClass, statements };
  }
}
