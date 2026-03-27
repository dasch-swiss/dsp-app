import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { IriLabelPair, Predicate } from '../../model';
import { Operator } from '../../operators.config';
import { PropertyFormManager } from '../property-form.manager';
import { SearchStateService } from '../search-state.service';

describe('PropertyFormManager', () => {
  let service: PropertyFormManager;
  let searchStateService: SearchStateService;

  const mockResourceClass: IriLabelPair = {
    iri: 'http://test.org/Class',
    label: 'TestClass',
  };

  const mockLinkedResourceClass: IriLabelPair = {
    iri: 'http://test.org/LinkedClass',
    label: 'LinkedClass',
  };

  const mockTextPredicate = new Predicate('http://test.org/hasText', 'Has Text', Constants.TextValue, false);

  const mockLinkPredicate = new Predicate('http://test.org/hasLink', 'Has Link', 'http://test.org/LinkedClass', true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PropertyFormManager, SearchStateService],
    });
    service = TestBed.inject(PropertyFormManager);
    searchStateService = TestBed.inject(SearchStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('empty statement insertion', () => {
    it('should add empty sibling statement when completing a root statement', () => {
      service.setMainResource(mockResourceClass);
      const statement = searchStateService.currentState.statementElements[0];

      statement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(statement, Operator.Equals);
      service.setObjectValue(statement, 'test value');

      const statements = searchStateService.currentState.statementElements;
      expect(statements).toHaveLength(2);
      expect(statements[1].isPristine).toBe(true);
      expect(statements[1].subjectNode?.value?.iri).toBe(mockResourceClass.iri);
    });

    it('should insert empty statement at correct position after completed statement', () => {
      service.setMainResource(mockResourceClass);
      const firstStatement = searchStateService.currentState.statementElements[0];

      // Complete first statement
      firstStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstStatement, Operator.Equals);
      service.setObjectValue(firstStatement, 'value 1');

      // Complete second statement
      const secondStatement = searchStateService.currentState.statementElements[1];
      secondStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondStatement, Operator.Equals);
      service.setObjectValue(secondStatement, 'value 2');

      const statements = searchStateService.currentState.statementElements;
      expect(statements).toHaveLength(3);
      expect(statements[0].selectedObjectValue).toBe('value 1');
      expect(statements[1].selectedObjectValue).toBe('value 2');
      expect(statements[2].isPristine).toBe(true);
    });

    it('should not add empty statement when statement is incomplete', () => {
      service.setMainResource(mockResourceClass);
      const statement = searchStateService.currentState.statementElements[0];

      statement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(statement, Operator.Equals);
      // Not setting object value - statement is incomplete

      const statements = searchStateService.currentState.statementElements;
      expect(statements).toHaveLength(1);
    });
  });

  describe('child statement management', () => {
    it('should add empty child statement when completing a link property with Matches operator', () => {
      service.setMainResource(mockResourceClass);
      const statement = searchStateService.currentState.statementElements[0];

      statement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(statement, Operator.Matches);
      service.setObjectValue(statement, mockLinkedResourceClass);

      const statements = searchStateService.currentState.statementElements;
      const childStatements = statements.filter(s => s.parentId === statement.id);

      expect(childStatements).toHaveLength(1);
      expect(childStatements[0].isPristine).toBe(true);
      expect(childStatements[0].subjectNode?.value?.iri).toBe(mockLinkedResourceClass.iri);
      expect(childStatements[0].statementLevel).toBe(1);
    });

    it('should add new empty child statement when completing an existing child statement', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = searchStateService.currentState.statementElements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Get and complete the child statement
      let statements = searchStateService.currentState.statementElements;
      const childStatement = statements.find(s => s.parentId === parentStatement.id)!;

      childStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(childStatement, Operator.Equals);
      service.setObjectValue(childStatement, 'child value');

      // Should have added another empty child
      statements = searchStateService.currentState.statementElements;
      const childStatements = statements.filter(s => s.parentId === parentStatement.id);

      expect(childStatements).toHaveLength(2);
      expect(childStatements[0].selectedObjectValue).toBe('child value');
      expect(childStatements[1].isPristine).toBe(true);
    });

    it('should insert child statement at correct position after existing children', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = searchStateService.currentState.statementElements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Complete first child
      let statements = searchStateService.currentState.statementElements;
      const firstChild = statements.find(s => s.parentId === parentStatement.id)!;
      firstChild.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstChild, Operator.Equals);
      service.setObjectValue(firstChild, 'first child');

      // Complete second child
      statements = searchStateService.currentState.statementElements;
      const secondChild = statements.filter(s => s.parentId === parentStatement.id)[1];
      secondChild.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondChild, Operator.Equals);
      service.setObjectValue(secondChild, 'second child');

      statements = searchStateService.currentState.statementElements;
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
      const parentStatement = searchStateService.currentState.statementElements[0];

      // Complete parent with link property
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Verify child exists
      let statements = searchStateService.currentState.statementElements;
      expect(statements.filter(s => s.parentId === parentStatement.id)).toHaveLength(1);

      // Change parent's object value
      const newLinkedClass: IriLabelPair = { iri: 'http://test.org/OtherClass', label: 'OtherClass' };
      service.setObjectValue(parentStatement, newLinkedClass);

      // Old children should be removed, new child added
      statements = searchStateService.currentState.statementElements;
      const children = statements.filter(s => s.parentId === parentStatement.id);
      expect(children).toHaveLength(1);
      expect(children[0].subjectNode?.value?.iri).toBe(newLinkedClass.iri);
    });
  });

  describe('deleteStatement', () => {
    it('should remove all children when deleting parent statement', () => {
      service.setMainResource(mockResourceClass);
      const parentStatement = searchStateService.currentState.statementElements[0];

      // Complete parent with link property to create child
      parentStatement.selectedPredicate = mockLinkPredicate;
      service.setSelectedOperator(parentStatement, Operator.Matches);
      service.setObjectValue(parentStatement, mockLinkedResourceClass);

      // Verify we have parent + empty sibling + child
      let statements = searchStateService.currentState.statementElements;
      const childId = statements.find(s => s.parentId === parentStatement.id)?.id;
      expect(childId).toBeDefined();

      // Delete parent
      service.deleteStatement(parentStatement);

      // Parent and child should be removed
      statements = searchStateService.currentState.statementElements;
      expect(statements.find(s => s.id === parentStatement.id)).toBeUndefined();
      expect(statements.find(s => s.id === childId)).toBeUndefined();
    });

    it('should keep statements after deleted parent', () => {
      service.setMainResource(mockResourceClass);
      const firstStatement = searchStateService.currentState.statementElements[0];

      // Complete first statement (no children)
      firstStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(firstStatement, Operator.Equals);
      service.setObjectValue(firstStatement, 'value 1');

      // Complete second statement
      let statements = searchStateService.currentState.statementElements;
      const secondStatement = statements[1];
      secondStatement.selectedPredicate = mockTextPredicate;
      service.setSelectedOperator(secondStatement, Operator.Equals);
      service.setObjectValue(secondStatement, 'value 2');

      // Delete first statement
      service.deleteStatement(firstStatement);

      // Second statement and empty third should remain
      statements = searchStateService.currentState.statementElements;
      expect(statements.find(s => s.id === firstStatement.id)).toBeUndefined();
      expect(statements.find(s => s.id === secondStatement.id)).toBeDefined();
    });
  });
});
