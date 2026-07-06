import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { IriLabelPair, NodeValue, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { makeIriLabelPair, makePredicate } from '../../testing/test-data-builders';
import { DerivedSearchState, DerivedSearchStateService } from '../derived-search-state.service';
import { StatementDraftStore } from '../statement-draft.store';

describe('StatementDraftStore', () => {
  let service: StatementDraftStore;

  const mockResourceClass: IriLabelPair = makeIriLabelPair('http://test.org/Class', 'TestClass');

  const mockLinkedResourceClass: IriLabelPair = makeIriLabelPair('http://test.org/LinkedClass', 'LinkedClass');

  const mockTextPredicate = makePredicate('http://test.org/hasText', 'Has Text', Constants.TextValue, false);

  const mockLinkPredicate = makePredicate('http://test.org/hasLink', 'Has Link', 'http://test.org/LinkedClass', true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatementDraftStore,
        // The manager seeds its store from searchState$ on construction; an inert stream leaves the
        // default single blank root in place so these auto-grow tests drive the tree directly.
        { provide: DerivedSearchStateService, useValue: { searchState$: EMPTY } as Partial<DerivedSearchStateService> },
      ],
    });
    service = TestBed.inject(StatementDraftStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('holds the editing tree in its own store (no SearchStateService dependency — Phase 3.5 Step 3)', () => {
    service.setMainResource(mockResourceClass);
    const statement = service.currentStatements[0];
    statement.selectedPredicate = mockTextPredicate;
    service.setSelectedOperator(statement, Operator.Equals);
    service.setObjectValue(statement, 'test value');

    // Completing the root grows a trailing blank sibling — all in the manager's own store.
    expect(service.currentStatements).toHaveLength(2);
    expect(service.currentStatements[1].isPristine).toBe(true);
  });

  describe('reactive seed from searchState$ (Phase 3.5 Step 2)', () => {
    // Build the manager against a controllable searchState$ so we can assert the seed re-keys children
    // onto URL-confirmed parents.
    const buildWithState = (statements: StatementElement[]) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StatementDraftStore,
          {
            provide: DerivedSearchStateService,
            useValue: {
              searchState$: of({ resourceClass: null, statements, orderByItems: [] }),
            } as Partial<DerivedSearchStateService>,
          },
        ],
      });
      return TestBed.inject(StatementDraftStore);
    };

    const makeConfirmedLink = (): StatementElement => {
      const stmt = new StatementElement(new NodeValue(mockResourceClass.iri, mockResourceClass), 0);
      stmt.selectedPredicate = mockLinkPredicate;
      stmt.selectedOperator = Operator.Matches;
      stmt.selectedObjectValue = mockLinkedResourceClass;
      return stmt;
    };

    it('leaves a single blank root when there are no confirmed statements', () => {
      const svc = buildWithState([]);
      expect(svc.currentStatements).toHaveLength(1);
      expect(svc.currentStatements[0].isPristine).toBe(true);
    });

    it('appends a trailing blank child under a confirmed link statement that opens a sub-query', () => {
      const parent = makeConfirmedLink();
      const svc = buildWithState([parent]);

      const children = svc.currentStatements.filter(s => s.parentId === parent.id);
      expect(children).toHaveLength(1);
      expect(children[0].isPristine).toBe(true);
      expect(children[0].statementLevel).toBe(1);
      expect(children[0].subjectNode?.value?.iri).toBe(mockLinkedResourceClass.iri);
    });

    it('does not add a child under a plain value statement', () => {
      const stmt = new StatementElement(new NodeValue(mockResourceClass.iri, mockResourceClass), 0);
      stmt.selectedPredicate = mockTextPredicate;
      stmt.selectedOperator = Operator.Equals;
      stmt.selectedObjectValue = 'x';
      const svc = buildWithState([stmt]);

      expect(svc.currentStatements.filter(s => s.parentId === stmt.id)).toHaveLength(0);
    });

    it('re-keys the blank child onto the new parent identity on a subsequent URL emission', () => {
      // First emission: parent A + its blank child. Second emission: a fresh parent B (new id, as
      // buildStatementsFromFilterParams produces on every URL change). The child must hang off B, not A.
      const parentA = makeConfirmedLink();
      const store$ = new BehaviorSubject<DerivedSearchState>({
        resourceClass: null,
        statements: [parentA],
        orderByItems: [],
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StatementDraftStore,
          {
            provide: DerivedSearchStateService,
            useValue: { searchState$: store$ } as Partial<DerivedSearchStateService>,
          },
        ],
      });
      const svc = TestBed.inject(StatementDraftStore);
      expect(svc.currentStatements.some(s => s.parentId === parentA.id && s.isPristine)).toBe(true);

      const parentB = makeConfirmedLink(); // fresh instance → different id
      store$.next({ resourceClass: null, statements: [parentB], orderByItems: [] });

      expect(parentB.id).not.toBe(parentA.id);
      expect(svc.currentStatements.some(s => s.parentId === parentB.id && s.isPristine)).toBe(true);
      expect(svc.currentStatements.some(s => s.parentId === parentA.id)).toBe(false);
    });
  });

  describe('empty statement insertion', () => {
    it('should add empty sibling statement when completing a root statement', () => {
      service.setMainResource(mockResourceClass);
      const statement = service.currentStatements[0];

      statement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(statement, Operator.Equals);
      service.setObjectValue(statement, 'test value');

      const statements = service.currentStatements;
      expect(statements).toHaveLength(2);
      expect(statements[1].isPristine).toBe(true);
      expect(statements[1].subjectNode?.value?.iri).toBe(mockResourceClass.iri);
    });

    it('should insert empty statement at correct position after completed statement', () => {
      service.setMainResource(mockResourceClass);
      const firstStatement = service.currentStatements[0];

      // Complete first statement
      firstStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstStatement, Operator.Equals);
      service.setObjectValue(firstStatement, 'value 1');

      // Complete second statement
      const secondStatement = service.currentStatements[1];
      secondStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondStatement, Operator.Equals);
      service.setObjectValue(secondStatement, 'value 2');

      const statements = service.currentStatements;
      expect(statements).toHaveLength(3);
      expect(statements[0].selectedObjectValue).toBe('value 1');
      expect(statements[1].selectedObjectValue).toBe('value 2');
      expect(statements[2].isPristine).toBe(true);
    });

    it('should not add empty statement when statement is incomplete', () => {
      service.setMainResource(mockResourceClass);
      const statement = service.currentStatements[0];

      statement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(statement, Operator.Equals);
      // Not setting object value - statement is incomplete

      const statements = service.currentStatements;
      expect(statements).toHaveLength(1);
    });
  });

  describe('child statement management', () => {
    it('should add empty child statement when completing a link property with Matches operator', () => {
      service.setMainResource(mockResourceClass);
      const statement = service.currentStatements[0];

      statement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(statement, Operator.Matches);
      service.setObjectValue(statement, mockLinkedResourceClass);

      const statements = service.currentStatements;
      const childStatements = statements.filter(s => s.parentId === statement.id);

      expect(childStatements).toHaveLength(1);
      expect(childStatements[0].isPristine).toBe(true);
      expect(childStatements[0].subjectNode?.value?.iri).toBe(mockLinkedResourceClass.iri);
      expect(childStatements[0].statementLevel).toBe(1);
    });

    it('should add new empty child statement when completing an existing child statement', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = service.currentStatements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Get and complete the child statement
      let statements = service.currentStatements;
      const childStatement = statements.find(s => s.parentId === parentStatement.id)!;

      childStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(childStatement, Operator.Equals);
      service.setObjectValue(childStatement, 'child value');

      // Should have added another empty child
      statements = service.currentStatements;
      const childStatements = statements.filter(s => s.parentId === parentStatement.id);

      expect(childStatements).toHaveLength(2);
      expect(childStatements[0].selectedObjectValue).toBe('child value');
      expect(childStatements[1].isPristine).toBe(true);
    });

    it('should insert child statement at correct position after existing children', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = service.currentStatements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Complete first child
      let statements = service.currentStatements;
      const firstChild = statements.find(s => s.parentId === parentStatement.id)!;
      firstChild.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstChild, Operator.Equals);
      service.setObjectValue(firstChild, 'first child');

      // Complete second child
      statements = service.currentStatements;
      const secondChild = statements.filter(s => s.parentId === parentStatement.id)[1];
      secondChild.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondChild, Operator.Equals);
      service.setObjectValue(secondChild, 'second child');

      statements = service.currentStatements;
      const parentIndex = statements.findIndex(s => s.id === parentStatement.id);
      const childStatements = statements.filter(s => s.parentId === parentStatement.id);

      // All children should be after parent
      childStatements.forEach(child => {
        const childIndex = statements.findIndex(s => s.id === child.id);
        expect(childIndex).toBeGreaterThan(parentIndex);
      });

      // Third child (empty) should be last among children
      expect(childStatements[2].isPristine).toBe(true);
    });

    it('should remove children when parent object value changes', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = service.currentStatements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Verify child exists
      let statements = service.currentStatements;
      expect(statements.filter(s => s.parentId === parentStatement.id)).toHaveLength(1);

      // Change parent's object value
      const newLinkedClass: IriLabelPair = makeIriLabelPair('http://test.org/OtherClass', 'OtherClass');
      service.setObjectValue(parentStatement, newLinkedClass);

      // Old children should be removed, new child added
      statements = service.currentStatements;
      const children = statements.filter(s => s.parentId === parentStatement.id);
      expect(children).toHaveLength(1);
      expect(children[0].subjectNode?.value?.iri).toBe(newLinkedClass.iri);
    });
  });

  describe('deleteStatement', () => {
    it('should remove all children when deleting parent statement', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = service.currentStatements[0];

      // Complete parent with link property to create child
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Verify we have parent + empty sibling + child
      let statements = service.currentStatements;
      const childId = statements.find(s => s.parentId === parentStatement.id)?.id;
      expect(childId).toBeDefined();

      // Delete parent
      service.deleteStatement(parentStatement);

      // Parent and child should be removed
      statements = service.currentStatements;
      expect(statements.find(s => s.id === parentStatement.id)).toBeUndefined();
      expect(statements.find(s => s.id === childId)).toBeUndefined();
    });

    it('should keep statements after deleted parent', () => {
      service.setMainResource(mockResourceClass);
      const firstStatement = service.currentStatements[0];

      // Complete first statement (no children)
      firstStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstStatement, Operator.Equals);
      service.setObjectValue(firstStatement, 'value 1');

      // Complete second statement
      let statements = service.currentStatements;
      const secondStatement = statements[1];
      secondStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondStatement, Operator.Equals);
      service.setObjectValue(secondStatement, 'value 2');

      // Delete first statement
      service.deleteStatement(firstStatement);

      // Second statement and empty third should remain
      statements = service.currentStatements;
      expect(statements.find(s => s.id === firstStatement.id)).toBeUndefined();
      expect(statements.find(s => s.id === secondStatement.id)).toBeDefined();
    });
  });
});
