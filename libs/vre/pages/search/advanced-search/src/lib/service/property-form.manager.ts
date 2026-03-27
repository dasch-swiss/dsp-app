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

  setMainResource(resourceClass: IriLabelPair): void {
    const statement = new StatementElement(new NodeValue(resourceClass.iri, resourceClass), 0);
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

  setSelectedPredicate(statement: StatementElement, selectedProperty: Predicate): void {
    statement.selectedPredicate = selectedProperty;
    this.searchStateService.updateStatement(statement);
  }

  setSelectedOperator(statement: StatementElement, selectedOperator: Operator): void {
    statement.selectedOperator = selectedOperator;
    this._updateStatementAndUpdateForms(statement);
  }

  setObjectValue(statement: StatementElement, searchValue: string | IriLabelPair): void {
    statement.selectedObjectValue = searchValue;
    this._updateStatementAndUpdateForms(statement);
  }

  private _updateStatementAndUpdateForms(statement: StatementElement): void {
    this.searchStateService.updateStatement(statement);
    this._addEmptyStatementIfNecessary(statement);
    this._removeChildrenOfStatement(statement);
    this._addChildIfNecessary(statement);
  }

  private _removeChildrenOfStatement(statement: StatementElement): void {
    this.searchStateService.patchState({
      statementElements: this.searchStateService.currentState.statementElements.filter(
        s => s.parentId !== statement.id
      ),
    });
  }

  private _addEmptyStatementIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && this._LastForSameSubject(statement) && !statement.parentId) {
      this._insertEmptyStatement(statement);
    }
  }

  private _addChildIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && (statement.objectType === 'RESOURCE_OBJECT' || statement.parentId)) {
      const parentStatement = statement.parentId
        ? this.searchStateService.currentState.statementElements.find(s => s.id === statement?.parentId)
        : statement;
      if (parentStatement && !this._hasEmptyChildStatement(parentStatement)) {
        this._insertChildStatement(parentStatement);
      }
    }
  }

  private _insertChildStatement(parentStatement: StatementElement): void {
    const { statementElements } = this.searchStateService.currentState;

    const parentIndex = statementElements.findIndex(se => se.id === parentStatement.id);
    const lastChild = statementElements.filter(s => s.parentId === parentStatement.id).pop();

    const insertIndex = lastChild ? statementElements.findIndex(se => se.id === lastChild.id) + 1 : parentIndex + 1;

    this.searchStateService.patchState({
      statementElements: [
        ...statementElements.slice(0, insertIndex),
        new StatementElement(
          parentStatement.selectedObjectNode as NodeValue,
          parentStatement.statementLevel + 1,
          parentStatement
        ),
        ...statementElements.slice(insertIndex),
      ],
    });
  }

  private _insertEmptyStatement(currentStatement: StatementElement): void {
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

  private _hasEmptyChildStatement(statement: StatementElement): boolean {
    const currentState = this.searchStateService.currentState;
    const childStatements = currentState.statementElements.filter(
      s => s.parentId === statement.id && !s.isValidAndComplete
    );
    return childStatements.length > 0;
  }

  private _LastForSameSubject(statement: StatementElement): boolean {
    const sameSubject = this.searchStateService.currentState.statementElements.filter(
      s =>
        s.statementLevel === statement.statementLevel && s.subjectNode?.value?.iri === statement.subjectNode?.value?.iri
    );

    return sameSubject.length > 0 && sameSubject[sameSubject.length - 1].id === statement.id;
  }
}
