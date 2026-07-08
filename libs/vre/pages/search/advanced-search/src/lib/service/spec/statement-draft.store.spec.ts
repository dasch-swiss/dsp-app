import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { EMPTY, of } from 'rxjs';
import { IriLabelPair, NodeValue, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { makeIriLabelPair, makePredicate } from '../../testing/test-data-builders';
import { DerivedSearchStateService } from '../derived-search-state.service';
import { StatementDraftStore } from '../statement-draft.store';

describe('StatementDraftStore', () => {
  let service: StatementDraftStore;

  const mockResourceClass: IriLabelPair = makeIriLabelPair('http://test.org/Class', 'TestClass');
  const mockLinkedResourceClass: IriLabelPair = makeIriLabelPair('http://test.org/LinkedClass', 'LinkedClass');
  const mockTextPredicate = makePredicate('http://test.org/hasText', 'Has Text', Constants.TextValue, false);
  const mockLinkPredicate = makePredicate('http://test.org/hasLink', 'Has Link', 'http://test.org/LinkedClass', true);

  /** Complete a statement as a link + Matches sub-query pointing at the linked class. */
  const makeSubQuery = (statement: StatementElement, linkedClass = mockLinkedResourceClass): void => {
    service.setSelectedPredicate(statement, mockLinkPredicate);
    service.setSelectedOperator(statement, Operator.Matches);
    service.setObjectValue(statement, linkedClass);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatementDraftStore,
        // The store seeds from searchState$ on construction; an inert stream leaves the default single
        // blank root in place so these tests drive the tree directly.
        { provide: DerivedSearchStateService, useValue: { searchState$: EMPTY } as Partial<DerivedSearchStateService> },
      ],
    });
    service = TestBed.inject(StatementDraftStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('holds the editing tree in its own store (no SearchStateService dependency)', () => {
    service.setMainResource(mockResourceClass);
    const statement = service.currentStatements[0];
    service.setSelectedPredicate(statement, mockTextPredicate);
    service.setSelectedOperator(statement, Operator.Equals);
    service.setObjectValue(statement, 'test value');

    // Editing no longer auto-grows a trailing sibling — the single root is edited in place.
    expect(service.currentStatements).toHaveLength(1);
    expect(service.currentStatements[0].selectedObjectValue).toBe('test value');
  });

  describe('reactive seed from searchState$', () => {
    // Build against a searchState$ that carries a selected resource class, mirroring a URL with `?class=`.
    const buildWithClass = (resourceClass: IriLabelPair | null, statements: StatementElement[] = []) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StatementDraftStore,
          {
            provide: DerivedSearchStateService,
            useValue: {
              searchState$: of({ resourceClass, statements, orderByItems: [] }),
            } as Partial<DerivedSearchStateService>,
          },
        ],
      });
      return TestBed.inject(StatementDraftStore);
    };

    it('leaves a single blank root when there are no confirmed statements', () => {
      const svc = buildWithClass(null, []);
      expect(svc.currentStatements).toHaveLength(1);
      expect(svc.currentStatements[0].isPristine).toBe(true);
    });

    it('seeds the blank root with the selected class subject so the property picker is class-scoped (DEV-6576)', () => {
      const svc = buildWithClass(mockResourceClass);
      expect(svc.currentStatements[0].subjectNode?.value?.iri).toBe(mockResourceClass.iri);
    });

    it('leaves the blank root subjectless for "all resource classes" (null class → all properties)', () => {
      const svc = buildWithClass(null);
      expect(svc.currentStatements[0].subjectNode).toBeUndefined();
    });

    it('seeds a subsequently added blank statement with the selected class subject (DEV-6576)', () => {
      const svc = buildWithClass(mockResourceClass);
      const added = svc.addBlankStatement();
      expect(added.subjectNode?.value?.iri).toBe(mockResourceClass.iri);
    });

    it('takes confirmed statements as-is without appending trailing blank children', () => {
      const parent = new StatementElement(new NodeValue(mockResourceClass.iri, mockResourceClass), 0);
      parent.selectedPredicate = mockLinkPredicate;
      parent.selectedOperator = Operator.Matches;
      parent.selectedObjectValue = mockLinkedResourceClass;
      const svc = buildWithClass(null, [parent]);

      // No auto-grown blank child: nesting is now edited explicitly in the popover.
      expect(svc.currentStatements).toEqual([parent]);
      expect(svc.childrenOf(parent)).toHaveLength(0);
    });
  });

  describe('addChildStatement', () => {
    it('adds a blank subcriterion under a sub-query, scoped to the linked class, at level+1', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);

      const child = service.addChildStatement(parent);

      const children = service.childrenOf(parent);
      expect(children).toEqual([child]);
      expect(child.isPristine).toBe(true);
      expect(child.parentId).toBe(parent.id);
      expect(child.statementLevel).toBe(1);
      expect(child.subjectNode?.value?.iri).toBe(mockLinkedResourceClass.iri);
    });

    it('inserts each new subcriterion after the parent’s existing subtree, keeping parent before children', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);

      const first = service.addChildStatement(parent);
      const second = service.addChildStatement(parent);

      const ids = service.currentStatements.map(s => s.id);
      expect(ids.indexOf(parent.id)).toBeLessThan(ids.indexOf(first.id));
      expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
    });

    it('supports nesting to arbitrary depth (grandchildren)', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      const child = service.addChildStatement(parent);
      makeSubQuery(child);

      const grandchild = service.addChildStatement(child);

      expect(service.childrenOf(child)).toEqual([grandchild]);
      expect(service.descendantsOf(parent)).toEqual([child, grandchild]);
      expect(grandchild.statementLevel).toBe(2);
    });
  });

  describe('pruning subcriteria when a statement stops opening a sub-query', () => {
    it('removes the subtree when the operator changes away from Matches', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      service.addChildStatement(parent);
      expect(service.childrenOf(parent)).toHaveLength(1);

      service.setSelectedOperator(parent, Operator.Exists);

      expect(service.childrenOf(parent)).toHaveLength(0);
    });

    it('removes the subtree when the predicate changes to a non-link property', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      service.addChildStatement(parent);

      service.setSelectedPredicate(parent, mockTextPredicate);

      expect(service.childrenOf(parent)).toHaveLength(0);
    });

    it('keeps the subtree while the statement remains a sub-query (e.g. changing the linked class)', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      const child = service.addChildStatement(parent);

      const otherClass: IriLabelPair = makeIriLabelPair('http://test.org/OtherClass', 'OtherClass');
      service.setObjectValue(parent, otherClass);

      expect(service.childrenOf(parent)).toEqual([child]);
    });
  });

  describe('subtreeComplete', () => {
    it('is false for an incomplete statement', () => {
      service.setMainResource(mockResourceClass);
      const stmt = service.currentStatements[0];
      service.setSelectedPredicate(stmt, mockTextPredicate);
      service.setSelectedOperator(stmt, Operator.Equals);
      // no object value
      expect(service.subtreeComplete(stmt)).toBe(false);
    });

    it('is true for a complete plain value statement', () => {
      service.setMainResource(mockResourceClass);
      const stmt = service.currentStatements[0];
      service.setSelectedPredicate(stmt, mockTextPredicate);
      service.setSelectedOperator(stmt, Operator.Equals);
      service.setObjectValue(stmt, 'x');
      expect(service.subtreeComplete(stmt)).toBe(true);
    });

    it('is false for a sub-query with no subcriteria', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      expect(service.subtreeComplete(parent)).toBe(false);
    });

    it('is false for a sub-query whose subcriterion is incomplete', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      service.addChildStatement(parent); // blank
      expect(service.subtreeComplete(parent)).toBe(false);
    });

    it('is true for a sub-query whose subcriteria are all complete (any depth)', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      const child = service.addChildStatement(parent);
      service.setSelectedPredicate(child, mockTextPredicate);
      service.setSelectedOperator(child, Operator.Equals);
      service.setObjectValue(child, 'child value');
      expect(service.subtreeComplete(parent)).toBe(true);
    });
  });

  describe('deleteStatement', () => {
    it('removes the whole subtree (any depth) when deleting a parent', () => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      const child = service.addChildStatement(parent);
      makeSubQuery(child);
      const grandchild = service.addChildStatement(child);

      service.deleteStatement(parent);

      const ids = service.currentStatements.map(s => s.id);
      expect(ids).not.toContain(parent.id);
      expect(ids).not.toContain(child.id);
      expect(ids).not.toContain(grandchild.id);
    });

    it('keeps sibling statements after a deleted parent', () => {
      service.setMainResource(mockResourceClass);
      const first = service.currentStatements[0];
      service.setSelectedPredicate(first, mockTextPredicate);
      service.setSelectedOperator(first, Operator.Equals);
      service.setObjectValue(first, 'value 1');

      const second = service.addBlankStatement();
      service.setSelectedPredicate(second, mockTextPredicate);
      service.setSelectedOperator(second, Operator.Equals);
      service.setObjectValue(second, 'value 2');

      service.deleteStatement(first);

      const ids = service.currentStatements.map(s => s.id);
      expect(ids).not.toContain(first.id);
      expect(ids).toContain(second.id);
    });
  });

  describe('isolated editing (beginEdit / commitEdit / cancelEdit)', () => {
    /** Seed the store with one confirmed link+Matches sub-query (parent + one complete subcriterion). */
    const seedConfirmedSubQuery = (): StatementElement => {
      service.setMainResource(mockResourceClass);
      const parent = service.currentStatements[0];
      makeSubQuery(parent);
      const child = service.addChildStatement(parent);
      service.setSelectedPredicate(child, mockTextPredicate);
      service.setSelectedOperator(child, Operator.Equals);
      service.setObjectValue(child, 'original');
      return parent;
    };

    it('beginEdit clones the whole subtree with fresh ids and flags them as editing', () => {
      const parent = seedConfirmedSubQuery();

      const clone = service.beginEdit(parent);

      expect(clone.id).not.toBe(parent.id);
      expect(service.isEditing(clone)).toBe(true);
      const cloneChildren = service.childrenOf(clone);
      expect(cloneChildren).toHaveLength(1);
      expect(cloneChildren[0].id).not.toBe(service.childrenOf(parent)[0].id);
      expect(service.isEditing(cloneChildren[0])).toBe(true);
      // Original is untouched and NOT flagged editing.
      expect(service.isEditing(parent)).toBe(false);
      expect(service.childrenOf(parent)[0].selectedObjectValue).toBe('original');
    });

    it('editing the clone does not mutate the original subtree', () => {
      const parent = seedConfirmedSubQuery();
      const clone = service.beginEdit(parent);
      const cloneChild = service.childrenOf(clone)[0];

      service.setObjectValue(cloneChild, 'edited');

      expect(service.childrenOf(clone)[0].selectedObjectValue).toBe('edited');
      // Original stays as it was — the displayed chip must not change mid-edit.
      expect(service.childrenOf(parent)[0].selectedObjectValue).toBe('original');
    });

    it('commitEdit promotes the clone (clears editing flags) and drops the original subtree', () => {
      const parent = seedConfirmedSubQuery();
      const clone = service.beginEdit(parent);
      const cloneChild = service.childrenOf(clone)[0];
      service.setObjectValue(cloneChild, 'edited');

      service.commitEdit(clone, parent);

      const ids = service.currentStatements.map(s => s.id);
      expect(ids).not.toContain(parent.id);
      expect(ids).toContain(clone.id);
      expect(service.isEditing(clone)).toBe(false);
      expect(service.childrenOf(clone)[0].selectedObjectValue).toBe('edited');
    });

    it('cancelEdit discards the clone subtree and leaves the original intact', () => {
      const parent = seedConfirmedSubQuery();
      const originalChildId = service.childrenOf(parent)[0].id;
      const clone = service.beginEdit(parent);

      service.cancelEdit(clone);

      const ids = service.currentStatements.map(s => s.id);
      expect(ids).not.toContain(clone.id);
      expect(ids).toContain(parent.id);
      expect(ids).toContain(originalChildId);
      expect(service.isEditing(clone)).toBe(false);
    });
  });

  describe('new-filter isolation (addBlankStatement / commitNewFilter)', () => {
    it('flags a newly added blank statement (and its subcriteria) as editing until committed', () => {
      service.setMainResource(mockResourceClass);
      const pending = service.addBlankStatement();
      expect(service.isEditing(pending)).toBe(true);

      // A subcriterion grown under the in-progress filter inherits the editing flag.
      makeSubQuery(pending);
      const child = service.addChildStatement(pending);
      expect(service.isEditing(child)).toBe(true);
    });

    it('commitNewFilter clears editing flags on the whole subtree', () => {
      service.setMainResource(mockResourceClass);
      const pending = service.addBlankStatement();
      makeSubQuery(pending);
      const child = service.addChildStatement(pending);

      service.commitNewFilter(pending);

      expect(service.isEditing(pending)).toBe(false);
      expect(service.isEditing(child)).toBe(false);
    });

    it('a URL reseed clears any in-flight editing flags', () => {
      service.setMainResource(mockResourceClass);
      const pending = service.addBlankStatement();
      expect(service.isEditing(pending)).toBe(true);

      // Simulate a URL-driven reseed by driving setMainResource (which replaces the tree). Editing flags
      // from the abandoned draft must not linger.
      service.setMainResource(mockResourceClass);
      // Any statement now in the store is a fresh instance and must not be flagged editing.
      expect(service.currentStatements.every(s => !service.isEditing(s))).toBe(true);
    });
  });
});
