import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { StatementElement, Predicate, IriLabelPair, NodeValue } from '../model';
import { Operator } from '../operators.config';
import { SearchStateService } from './search-state.service';

@Injectable()
export class PropertyFormManager implements OnDestroy {
  private searchStateService = inject(SearchStateService);
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setMainResource(resourceClass: IriLabelPair | undefined): void {
    const nodeValue = resourceClass ? new NodeValue(resourceClass.iri, resourceClass) : undefined;
    const statement = new StatementElement(nodeValue, 0);
    this.searchStateService.patchState({
      selectedResourceClass: resourceClass,
      statementElements: [statement],
      orderBy: [],
    });
  }

  deleteStatement(statement: StatementElement): void {
    const currentState = this.searchStateService.currentState;
    const statementElements = currentState.statementElements.filter(
      stm => stm.id !== statement.id && stm.parentId !== statement.id
    );
    this.searchStateService.patchState({
      statementElements,
    });
  }

  clearStatementElement(statement: StatementElement): void {
    statement.clearSelections();
    this.searchStateService.updateStatement(statement);
  }

  onPredicateSelectionChanged(statement: StatementElement, selectedProperty: Predicate): void {
    statement.selectedPredicate = selectedProperty;
    this.searchStateService.updateStatement(statement);
  }

  setSelectedOperator(statement: StatementElement, selectedOperator: Operator): void {
    statement.selectedOperator = selectedOperator;
    this._updateStatement(statement);
  }

  setObjectValue(statement: StatementElement, searchValue: string | IriLabelPair): void {
    this._removeChildrenIfAny(statement);
    statement.selectedObjectValue = searchValue;
    this._updateStatement(statement);
  }

  private _updateStatement(statement: StatementElement): void {
    this.searchStateService.updateStatement(statement);
    this._addEmptyStatementIfNecessary(statement);
    this._removeChildrenIfAny(statement);
    this._addChildIfNecessary(statement);
  }

  private _removeChildrenIfAny(statement: StatementElement): void {
    const hasChildren = this.searchStateService.currentState.statementElements.some(s => s.parentId === statement.id);
    if (hasChildren) {
      const currentState = this.searchStateService.currentState;
      const statementElements = currentState.statementElements.filter(stm => stm.parentId !== statement.id);
      this.searchStateService.patchState({
        statementElements,
      });
    }
  }

  private _addEmptyStatementIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && this._isLastOrLastForSameSubject(statement) && !statement.parentId) {
      this._addEmptyStatement(statement);
    }
  }

  private _addChildIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && (statement.selectedOperator === Operator.Matches || statement.parentId)) {
      if (!this._hasIncompleteChildStatement(statement)) {
        const previousParent = this.searchStateService.currentState.statementElements.find(
          s => s.id === statement?.parentId
        );
        const parentStatement = previousParent || statement;
        this._addChildStatement(parentStatement);
      }
    }
  }

  private _addChildStatement(parentStatement: StatementElement): void {
    const currentState = this.searchStateService.currentState;
    const parentIndex = currentState.statementElements.findIndex(se => se === parentStatement);
    // get the index of any child statements which come after the parent
    const lastChild = currentState.statementElements.filter(s => s.parentId === parentStatement.id).pop();
    const insertIndex = lastChild
      ? currentState.statementElements.findIndex(se => se === lastChild) + 1
      : parentIndex + 1;
    const statementsBeforeParent = currentState.statementElements.slice(0, insertIndex);
    const statementsAfterParent = currentState.statementElements.slice(insertIndex);
    this.searchStateService.patchState({
      statementElements: [
        ...statementsBeforeParent,
        new StatementElement(
          parentStatement.selectedObjectNode as NodeValue,
          parentStatement.statementLevel + 1,
          parentStatement
        ),
        ...statementsAfterParent,
      ],
    });
  }

  private _addEmptyStatement(currentStatement: StatementElement): void {
    const currentState = this.searchStateService.currentState;
    const currentIndex = currentState.statementElements.findIndex(se => se === currentStatement);
    const statementsBefore = currentState.statementElements.slice(0, currentIndex + 1);
    const statementsAfter = currentState.statementElements.slice(currentIndex + 1);
    this.searchStateService.patchState({
      statementElements: [
        ...statementsBefore,
        new StatementElement(currentStatement.subjectNode!, currentStatement.statementLevel),
        ...statementsAfter,
      ],
    });
  }

  private _hasIncompleteChildStatement(statement: StatementElement): boolean {
    const currentState = this.searchStateService.currentState;
    const childStatements = currentState.statementElements.filter(
      s => s.parentId === statement.id && !s.isValidAndComplete
    );
    return childStatements.length > 0;
  }

  private _isLastOrLastForSameSubject(statement: StatementElement): boolean {
    const isLast =
      this.searchStateService.currentState.statementElements[
        this.searchStateService.currentState.statementElements.length - 1
      ] === statement;
    if (isLast) {
      return true;
    }
    const currentState = this.searchStateService.currentState;
    const statementsOfSameLevel = currentState.statementElements.filter(
      s =>
        s.statementLevel === statement.statementLevel &&
        s.subjectNode?.value &&
        s.subjectNode.value.iri === statement.subjectNode?.value?.iri
    );
    return (
      !!statementsOfSameLevel.length && statementsOfSameLevel[statementsOfSameLevel.length - 1]?.id === statement.id
    );
  }
}
