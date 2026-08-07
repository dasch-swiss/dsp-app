import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { BehaviorSubject, of } from 'rxjs';
import type { ResourceClassInfo } from '../ontology.types';
import { OntologyEditService } from './ontology-edit.service';
import { OntologyEditorViewService } from './ontology-editor-view.service';

/** Minimal `ResourceClassInfo` stub — only `.id` is read by the service. */
const makeClass = (id: string): ResourceClassInfo => ({ id }) as unknown as ResourceClassInfo;

describe('OntologyEditorViewService', () => {
  let currentOntologyClasses$: BehaviorSubject<ResourceClassInfo[]>;
  let currentOntology$: BehaviorSubject<{ id: string } | null>;
  let hasProjectAdminRights$: BehaviorSubject<boolean>;

  /**
   * The service uses `takeUntilDestroyed` which requires an injection context with a
   * `DestroyRef`. We provide one via a host component and read the service from it.
   */
  @Component({ standalone: true, template: '', providers: [OntologyEditorViewService] })
  class HostComponent {
    readonly service = inject(OntologyEditorViewService);
  }

  const setup = () => {
    currentOntologyClasses$ = new BehaviorSubject<ResourceClassInfo[]>([]);
    currentOntology$ = new BehaviorSubject<{ id: string } | null>(null);
    hasProjectAdminRights$ = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: OntologyEditService,
          useValue: {
            currentOntologyClasses$,
            currentOntology$,
          },
        },
        {
          provide: ProjectPageService,
          useValue: {
            hasProjectAdminRights$,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, service: fixture.componentInstance.service };
  };

  describe('initial state', () => {
    it('starts with empty selection and default filters', () => {
      const { service } = setup();
      expect(service.selectedClassIris$.value.size).toBe(0);
      expect(service.classFilterText$.value).toBe('');
      expect(service.propertyFilterText$.value).toBe('');
      expect(service.activePropertyCategories$.value.size).toBe(0);
      expect(service.unusedPropertiesOnly$.value).toBe(false);
      expect(service.keyboardAssignTargetIri$.value).toBeNull();
      expect(service.isPropertyDragging$.value).toBe(false);
    });
  });

  describe('class selection', () => {
    it('toggleClassSelection adds then removes an IRI', () => {
      const { service } = setup();
      service.toggleClassSelection('iri:A');
      expect(service.selectedClassIris$.value.has('iri:A')).toBe(true);
      service.toggleClassSelection('iri:A');
      expect(service.selectedClassIris$.value.has('iri:A')).toBe(false);
    });

    it('selectClassIris and deselectClassIris operate on multiple IRIs', () => {
      const { service } = setup();
      service.selectClassIris(['iri:A', 'iri:B', 'iri:C']);
      expect(service.selectedClassIris$.value.size).toBe(3);
      service.deselectClassIris(['iri:B']);
      expect(service.selectedClassIris$.value.has('iri:B')).toBe(false);
      expect(service.selectedClassIris$.value.size).toBe(2);
    });
  });

  describe('reconciliation on currentOntologyClasses$ emission', () => {
    it('drops a selected class IRI within one emission when it disappears from the list', () => {
      const { service } = setup();
      currentOntologyClasses$.next([makeClass('iri:A'), makeClass('iri:B')]);
      service.selectClassIris(['iri:A', 'iri:B']);
      expect(service.selectedClassIris$.value.size).toBe(2);

      // Concurrent edit removes class B.
      currentOntologyClasses$.next([makeClass('iri:A')]);

      expect(service.selectedClassIris$.value.has('iri:A')).toBe(true);
      expect(service.selectedClassIris$.value.has('iri:B')).toBe(false);
    });

    it('clears keyboardAssignTargetIri$ when the target class disappears', () => {
      const { service } = setup();
      currentOntologyClasses$.next([makeClass('iri:A'), makeClass('iri:B')]);
      service.setKeyboardAssignTarget('iri:B');
      expect(service.keyboardAssignTargetIri$.value).toBe('iri:B');

      currentOntologyClasses$.next([makeClass('iri:A')]);

      expect(service.keyboardAssignTargetIri$.value).toBeNull();
    });

    it('does not emit on selectedClassIris$ when nothing was removed', () => {
      const { service } = setup();
      currentOntologyClasses$.next([makeClass('iri:A')]);
      service.selectClassIris(['iri:A']);

      const emissions: Set<string>[] = [];
      service.selectedClassIris$.subscribe(v => emissions.push(v));
      // Initial replay = 1.
      expect(emissions.length).toBe(1);

      // Re-emit the same class list — no removals expected.
      currentOntologyClasses$.next([makeClass('iri:A')]);
      expect(emissions.length).toBe(1);
    });
  });

  describe('reset on ontology switch', () => {
    it('does NOT reset on the initial null -> id transition', () => {
      const { service } = setup();
      service.selectClassIris(['iri:A']);
      service.setClassFilter('foo');

      currentOntology$.next({ id: 'onto:1' });

      expect(service.selectedClassIris$.value.has('iri:A')).toBe(true);
      expect(service.classFilterText$.value).toBe('foo');
    });

    it('resets all state when the ontology id changes', () => {
      const { service } = setup();
      currentOntology$.next({ id: 'onto:1' });
      service.selectClassIris(['iri:A']);
      service.setClassFilter('foo');
      service.setPropertyFilter('bar');
      service.setKeyboardAssignTarget('iri:A');
      service.setUnusedPropertiesOnly(true);
      service.setPropertyCategoryFilters(['Text']);
      service.setPropertyDragging(true);

      currentOntology$.next({ id: 'onto:2' });

      expect(service.selectedClassIris$.value.size).toBe(0);
      expect(service.classFilterText$.value).toBe('');
      expect(service.propertyFilterText$.value).toBe('');
      expect(service.keyboardAssignTargetIri$.value).toBeNull();
      expect(service.unusedPropertiesOnly$.value).toBe(false);
      expect(service.activePropertyCategories$.value.size).toBe(0);
      expect(service.isPropertyDragging$.value).toBe(false);
    });

    it('does not reset when the same ontology id re-emits', () => {
      const { service } = setup();
      currentOntology$.next({ id: 'onto:1' });
      service.selectClassIris(['iri:A']);

      currentOntology$.next({ id: 'onto:1' });

      expect(service.selectedClassIris$.value.has('iri:A')).toBe(true);
    });
  });

  describe('isEditingEnabled$', () => {
    it('reflects hasProjectAdminRights$', () => {
      const { service } = setup();
      const emissions: boolean[] = [];
      service.isEditingEnabled$.subscribe(v => emissions.push(v));

      hasProjectAdminRights$.next(true);
      hasProjectAdminRights$.next(true); // duplicate — should be filtered by distinctUntilChanged
      hasProjectAdminRights$.next(false);

      expect(emissions).toEqual([false, true, false]);
    });
  });

  describe('drag state and teardown', () => {
    it('setPropertyDragging toggles isPropertyDragging$', () => {
      const { service } = setup();
      service.setPropertyDragging(true);
      expect(service.isPropertyDragging$.value).toBe(true);
      service.setPropertyDragging(false);
      expect(service.isPropertyDragging$.value).toBe(false);
    });

    it('after host destruction further ontology-class emissions do not mutate state', () => {
      const { fixture, service } = setup();
      currentOntologyClasses$.next([makeClass('iri:A')]);
      service.selectClassIris(['iri:A']);

      fixture.destroy();

      // Post-destroy emission would mutate selectedClassIris$ if takeUntilDestroyed
      // weren't wired correctly. The selection set captured before destroy must remain.
      currentOntologyClasses$.next([]);

      expect(service.selectedClassIris$.value.has('iri:A')).toBe(true);
    });
  });

  it('shape: of() helper compiles (smoke)', () => {
    expect(of(true)).toBeTruthy();
  });
});
