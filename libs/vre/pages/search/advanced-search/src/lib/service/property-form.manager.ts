import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { PropertyObjectType, StatementElement, Predicate, IriLabelPair, NodeValue } from '../model';
import { Operator } from '../operators.config';
import { SearchDerivationService } from './search-derivation.service';

/**
 * Owns the **ephemeral** in-progress statement tree (blank rows, in-progress children, unconfirmed
 * edits) plus the auto-grow logic that inserts trailing blank siblings/children as the user fills a
 * filter in (DEV-6576 Phase 3.5).
 *
 * The tree lives entirely in this service's own `_statements` store; it is seeded from the URL via
 * `searchState$` and never writes to `SearchStateService` (DEV-6576 Phase 3.5 Step 3 — the mirror
 * is gone). Consumers read `statements$`/`currentStatements`.
 */
@Injectable()
export class PropertyFormManager {
  private readonly _derivation = inject(SearchDerivationService);
  private readonly _destroyRef = inject(DestroyRef);

  // The ephemeral tree — this service's own source of truth for in-progress editing.
  private readonly _statements = new BehaviorSubject<StatementElement[]>([new StatementElement()]);

  readonly statements$: Observable<StatementElement[]> = this._statements.pipe(
    distinctUntilChanged((a, b) => a.length === b.length && a.every((s, i) => s === b[i]))
  );

  get currentStatements(): StatementElement[] {
    return this._statements.value;
  }

  constructor() {
    // Reactive seed (DEV-6576 Phase 3.5 Step 2): on every URL change the confirmed tree comes from
    // `searchState$` with fresh StatementElement instances (new ids). Rebuild the ephemeral store so
    // in-progress children re-key onto the *current* confirmed parents, and each confirmed link/
    // resource statement gets a trailing blank child to edit. Unconfirmed rows do not survive a URL
    // change — that is correct under D4/D6 (only the URL is durable). No DI cycle: SearchDerivationService
    // does not depend on PropertyFormManager.
    this._derivation.searchState$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(state => this._seedFromConfirmed(state.statements));
  }

  /**
   * Rebuild the editing tree from the URL-confirmed statements: keep the confirmed statements as-is,
   * then append a trailing blank child under every confirmed statement that opens a sub-query and does
   * not already have a pristine child. A single blank root row is preserved when there are no confirmed
   * statements so the user can start a filter.
   */
  private _seedFromConfirmed(confirmed: StatementElement[]): void {
    if (confirmed.length === 0) {
      this._statements.next([new StatementElement()]);
      return;
    }
    const next = [...confirmed];
    for (const stmt of confirmed) {
      if (this._opensSubQuery(stmt) && !next.some(s => s.parentId === stmt.id && !s.isValidAndComplete)) {
        next.push(new StatementElement(stmt.selectedObjectNode as NodeValue, stmt.statementLevel + 1, stmt));
      }
    }
    this._statements.next(next);
  }

  private _opensSubQuery(statement: StatementElement): boolean {
    return statement.isValidAndComplete && statement.objectType === PropertyObjectType.ResourceObject;
  }

  /** Set the tree with a new array reference so `statements$` emits. */
  private _setStatements(statements: StatementElement[]): void {
    this._statements.next([...statements]);
  }

  setMainResource(resourceClass: IriLabelPair): void {
    // Reset the ephemeral editing tree to a single root statement seeded with the new class. The
    // selected class + orderBy are URL params owned by resource-class-chip (`writeState`), not here.
    const statement = new StatementElement(new NodeValue(resourceClass.iri, resourceClass), 0);
    this._statements.next([statement]);
  }

  deleteStatement(statement: StatementElement): void {
    const statementElements = this.currentStatements.filter(
      stm => stm.id !== statement.id && stm.parentId !== statement.id
    );
    this._setStatements(statementElements);
  }

  setSelectedPredicate(statement: StatementElement, selectedProperty: Predicate): void {
    statement.selectedPredicate = selectedProperty;
    this._updateStatement(statement);
  }

  setSelectedOperator(statement: StatementElement, selectedOperator: Operator): void {
    statement.selectedOperator = selectedOperator;
    this._updateStatementAndUpdateForms(statement);
  }

  addBlankStatement(): StatementElement {
    const blank = new StatementElement();
    this._setStatements([...this.currentStatements, blank]);
    return blank;
  }

  restoreStatement(snapshot: StatementElement, target: StatementElement): void {
    target.clearSelections();
    if (snapshot.selectedPredicate) target.selectedPredicate = snapshot.selectedPredicate;
    if (snapshot.selectedOperator) target.selectedOperator = snapshot.selectedOperator;
    if (snapshot.selectedObjectValue !== undefined) {
      target.selectedObjectValue = snapshot.selectedObjectValue;
    }
    this._updateStatement(target);
  }

  setObjectValue(statement: StatementElement, searchValue: string | IriLabelPair): void {
    statement.selectedObjectValue = searchValue;
    this._updateStatementAndUpdateForms(statement);
  }

  /** Replace a statement in place by id. */
  private _updateStatement(statement: StatementElement): void {
    this._setStatements(this.currentStatements.map(p => (p.id === statement.id ? statement : p)));
  }

  private _updateStatementAndUpdateForms(statement: StatementElement): void {
    this._updateStatement(statement);
    this._addEmptyStatementIfNecessary(statement);
    this._removeChildrenOfStatement(statement);
    this._addChildIfNecessary(statement);
  }

  private _removeChildrenOfStatement(statement: StatementElement): void {
    this._setStatements(this.currentStatements.filter(s => s.parentId !== statement.id));
  }

  private _addEmptyStatementIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && this._LastForSameSubject(statement) && !statement.parentId) {
      this._insertEmptyStatement(statement);
    }
  }

  private _addChildIfNecessary(statement: StatementElement): void {
    if (statement.isValidAndComplete && (statement.objectType === 'RESOURCE_OBJECT' || statement.parentId)) {
      const parentStatement = statement.parentId
        ? this.currentStatements.find(s => s.id === statement?.parentId)
        : statement;
      if (parentStatement && !this._hasEmptyChildStatement(parentStatement)) {
        this._insertChildStatement(parentStatement);
      }
    }
  }

  private _insertChildStatement(parentStatement: StatementElement): void {
    const statementElements = this.currentStatements;

    const parentIndex = statementElements.findIndex(se => se.id === parentStatement.id);
    const lastChild = statementElements.filter(s => s.parentId === parentStatement.id).pop();

    const insertIndex = lastChild ? statementElements.findIndex(se => se.id === lastChild.id) + 1 : parentIndex + 1;

    this._setStatements([
      ...statementElements.slice(0, insertIndex),
      new StatementElement(
        parentStatement.selectedObjectNode as NodeValue,
        parentStatement.statementLevel + 1,
        parentStatement
      ),
      ...statementElements.slice(insertIndex),
    ]);
  }

  private _insertEmptyStatement(currentStatement: StatementElement): void {
    const statementElements = this.currentStatements;
    const currentIndex = statementElements.findIndex(se => se === currentStatement);
    const statementsBefore = statementElements.slice(0, currentIndex + 1);
    const statementsAfter = statementElements.slice(currentIndex + 1);
    this._setStatements([
      ...statementsBefore,
      new StatementElement(currentStatement.subjectNode!, currentStatement.statementLevel),
      ...statementsAfter,
    ]);
  }

  private _hasEmptyChildStatement(statement: StatementElement): boolean {
    const childStatements = this.currentStatements.filter(s => s.parentId === statement.id && !s.isValidAndComplete);
    return childStatements.length > 0;
  }

  private _LastForSameSubject(statement: StatementElement): boolean {
    const sameSubject = this.currentStatements.filter(
      s =>
        s.statementLevel === statement.statementLevel && s.subjectNode?.value?.iri === statement.subjectNode?.value?.iri
    );

    return sameSubject.length > 0 && sameSubject[sameSubject.length - 1].id === statement.id;
  }
}
