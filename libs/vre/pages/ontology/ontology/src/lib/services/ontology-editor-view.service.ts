import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { BehaviorSubject, distinctUntilChanged, map, pairwise, startWith } from 'rxjs';
import type { ResourceClassInfo } from '../ontology.types';
import { OntologyEditService } from './ontology-edit.service';

/**
 * Page-scoped view state for the ontology editor shell.
 *
 * Owned by `OntologyEditorShellComponent` (provided in the component's `providers: []`).
 * Holds selection, filters, keyboard-assign target, and drag state — none of which
 * belong on the domain-level `OntologyEditService`.
 *
 * Reconciliation:
 * - Subscribes to `OntologyEditService.currentOntologyClasses$` and intersects
 *   `selectedClassIris$` / `keyboardAssignTargetIri$` with the new IRI set so
 *   concurrent edits or external state changes can't leave dangling IRIs.
 * - Subscribes to `OntologyEditService.currentOntology$` and calls `reset()` on
 *   ontology switch (non-null id change, excluding initial emission).
 */
@Injectable()
export class OntologyEditorViewService {
  readonly selectedClassIris$ = new BehaviorSubject<Set<string>>(new Set<string>());
  readonly classFilterText$ = new BehaviorSubject<string>('');
  readonly propertyFilterText$ = new BehaviorSubject<string>('');
  readonly activePropertyCategories$ = new BehaviorSubject<Set<string>>(new Set<string>());
  readonly unusedPropertiesOnly$ = new BehaviorSubject<boolean>(false);
  readonly keyboardAssignTargetIri$ = new BehaviorSubject<string | null>(null);
  /** Bound to `<as-split [disabled]>` in the shell template (Phase 1 spike outcome). */
  readonly isPropertyDragging$ = new BehaviorSubject<boolean>(false);

  /** True when the current user has project-admin rights — controls edit affordances in the templates. */
  readonly isEditingEnabled$ = this._projectPageService.hasProjectAdminRights$.pipe(distinctUntilChanged());

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private readonly _ontologyEditService: OntologyEditService,
    private readonly _projectPageService: ProjectPageService
  ) {
    this._wireReconciliation();
    this._wireOntologySwitchReset();
  }

  toggleClassSelection(iri: string): void {
    const next = new Set(this.selectedClassIris$.value);
    if (next.has(iri)) {
      next.delete(iri);
    } else {
      next.add(iri);
    }
    this.selectedClassIris$.next(next);
  }

  selectClassIris(iris: Iterable<string>): void {
    const next = new Set(this.selectedClassIris$.value);
    for (const iri of iris) {
      next.add(iri);
    }
    this.selectedClassIris$.next(next);
  }

  deselectClassIris(iris: Iterable<string>): void {
    const next = new Set(this.selectedClassIris$.value);
    for (const iri of iris) {
      next.delete(iri);
    }
    this.selectedClassIris$.next(next);
  }

  setClassFilter(text: string): void {
    this.classFilterText$.next(text);
  }

  setPropertyFilter(text: string): void {
    this.propertyFilterText$.next(text);
  }

  setPropertyCategoryFilters(categoryGroups: Iterable<string>): void {
    this.activePropertyCategories$.next(new Set(categoryGroups));
  }

  setUnusedPropertiesOnly(value: boolean): void {
    this.unusedPropertiesOnly$.next(value);
  }

  setKeyboardAssignTarget(iri: string | null): void {
    this.keyboardAssignTargetIri$.next(iri);
  }

  setPropertyDragging(dragging: boolean): void {
    this.isPropertyDragging$.next(dragging);
  }

  /** Reset all view state to defaults. Called on ontology switch and may be called by callers. */
  reset(): void {
    this.selectedClassIris$.next(new Set<string>());
    this.classFilterText$.next('');
    this.propertyFilterText$.next('');
    this.activePropertyCategories$.next(new Set<string>());
    this.unusedPropertiesOnly$.next(false);
    this.keyboardAssignTargetIri$.next(null);
    this.isPropertyDragging$.next(false);
  }

  private _wireReconciliation(): void {
    this._ontologyEditService.currentOntologyClasses$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(classes => {
      const validIris = new Set(classes.map((c: ResourceClassInfo) => c.id));

      const current = this.selectedClassIris$.value;
      let removed = false;
      const intersected = new Set<string>();
      for (const iri of current) {
        if (validIris.has(iri)) {
          intersected.add(iri);
        } else {
          removed = true;
        }
      }
      if (removed) {
        this.selectedClassIris$.next(intersected);
      }

      const target = this.keyboardAssignTargetIri$.value;
      if (target !== null && !validIris.has(target)) {
        this.keyboardAssignTargetIri$.next(null);
      }
    });
  }

  private _wireOntologySwitchReset(): void {
    this._ontologyEditService.currentOntology$
      .pipe(
        map(onto => onto?.id ?? null),
        distinctUntilChanged(),
        startWith(null),
        pairwise(),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(([previous, current]) => {
        // Reset only when transitioning between two non-null ids (i.e., an actual
        // ontology switch — not the initial null -> id load).
        if (previous !== null && current !== null && previous !== current) {
          this.reset();
        }
      });
  }
}
