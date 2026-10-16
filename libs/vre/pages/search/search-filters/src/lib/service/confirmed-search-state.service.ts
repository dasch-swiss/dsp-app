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
 * Turns the host page's stored filter state into live objects.
 *
 * The page says *what* is confirmed ({@link SearchFilterState}); this service says what those filters
 * mean once the ontology is loaded — resolving predicate IRIs to `Predicate`s and rebuilding the
 * statement tree. That hydration is identical wherever the chip bar is mounted, which is why it sits
 * here rather than in either page's own derivation.
 *
 * It also owns the ontology-switch reaction, since the ontology to load is itself part of what the page
 * fixes.
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
   * Keeps the loaded ontology in sync with whatever the host fixes it to:
   *   - a non-empty value names the ontology to load;
   *   - an empty one (no ontology chosen, e.g. after Reset) falls back to the project default, so the
   *     Data Model chip reverts instead of staying stuck on a previously chosen ontology.
   * `setOntology` re-hydrates `resourceClasses$`/predicates and lets `loading$` settle. De-duped on the
   * incoming value plus an identity guard against the currently-loaded ontology, so an unchanged target
   * never reloads. This is the only thing that switches the ontology.
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
