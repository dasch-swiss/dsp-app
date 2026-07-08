import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { PropertyObjectType, StatementElement, Predicate, IriLabelPair, NodeValue } from '../model';
import { Operator } from '../operators.config';
import { DerivedSearchStateService } from './derived-search-state.service';

/**
 * Owns the **ephemeral** in-progress statement tree (blank rows, in-progress subcriteria, unconfirmed
 * edits). Subcriteria are added and removed explicitly from the popover (`addChildStatement` /
 * `deleteStatement`); the store prunes a statement's subtree when it stops opening a sub-query.
 *
 * The tree lives entirely in this service's own `_statements` store; it is seeded from the URL via
 * `DerivedSearchStateService.searchState$` and never writes back to the URL — committed state is the
 * URL's job. Consumers read `statements$`/`currentStatements`.
 */
@Injectable()
export class StatementDraftStore {
  private readonly _derivation = inject(DerivedSearchStateService);
  private readonly _destroyRef = inject(DestroyRef);

  // The ephemeral tree — this service's own source of truth for in-progress editing.
  private readonly _statements = new BehaviorSubject<StatementElement[]>([new StatementElement()]);

  // The currently-selected resource class (URL-derived, mirrored from `searchState$`). Used to seed every
  // new root statement's subject node so the property picker is scoped to that class. Null = "all classes".
  private _resourceClass: IriLabelPair | null = null;

  readonly statements$: Observable<StatementElement[]> = this._statements.pipe(
    distinctUntilChanged((a, b) => a.length === b.length && a.every((s, i) => s === b[i]))
  );

  get currentStatements(): StatementElement[] {
    return this._statements.value;
  }

  constructor() {
    // Reactive seed: on every URL change the confirmed tree comes from `searchState$` with fresh
    // StatementElement instances (new ids). Rebuild the ephemeral store so in-progress children re-key
    // onto the *current* confirmed parents, and each confirmed link/resource statement gets a trailing
    // blank child to edit. Unconfirmed rows do not survive a URL change — that is correct: only the URL
    // is durable. No DI cycle: DerivedSearchStateService does not depend on StatementDraftStore.
    this._derivation.searchState$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(state => {
      this._resourceClass = state.resourceClass;
      this._seedFromConfirmed(state.statements);
    });
  }

  /**
   * A fresh top-level statement, seeded with the selected resource class as its subject node when one is
   * chosen. That subject scopes the property picker (`getProperties$(subjectClass.iri)`) to the class; with
   * no class selected ("all classes") the subject is left empty so all properties remain available.
   */
  private _makeRootStatement(): StatementElement {
    return this._resourceClass?.iri
      ? new StatementElement(new NodeValue(this._resourceClass.iri, this._resourceClass), 0)
      : new StatementElement();
  }

  /**
   * Rebuild the editing tree from the URL-confirmed statements. Confirmed statements (including any
   * nested subcriteria, already wired parent→child by the URL reconstruction) are taken as-is; nested
   * editing is now popover-driven, so no trailing blank children are appended here. A single blank root
   * row is preserved when there are no confirmed statements so the user can start a filter.
   */
  private _seedFromConfirmed(confirmed: StatementElement[]): void {
    this._statements.next(confirmed.length === 0 ? [this._makeRootStatement()] : [...confirmed]);
  }

  /** Direct children of a statement in the ephemeral tree (one level). */
  childrenOf(parent: StatementElement): StatementElement[] {
    return this.currentStatements.filter(s => s.parentId === parent.id);
  }

  /** All descendants (children, grandchildren, …) of a statement, depth-first. */
  descendantsOf(parent: StatementElement): StatementElement[] {
    return this.childrenOf(parent).flatMap(child => [child, ...this.descendantsOf(child)]);
  }

  /**
   * A statement plus its whole subtree is ready to commit: the statement itself is complete, and — when
   * it opens a sub-query (link + Matches with a resource class picked) — it has at least one subcriterion
   * and every descendant is complete too.
   */
  subtreeComplete(statement: StatementElement): boolean {
    if (!statement.isValidAndComplete) return false;
    if (statement.objectType !== PropertyObjectType.ResourceObject) return true;
    const children = this.childrenOf(statement);
    return children.length > 0 && children.every(child => this.subtreeComplete(child));
  }

  /**
   * Explicit, user-driven insert of a blank subcriterion under `parent` (the "Add subcriteria" action).
   * The child inherits the parent's picked resource class as its subject so the property picker is scoped
   * to that class. Inserted right after the parent's existing subtree so nested rows stay grouped.
   */
  addChildStatement(parent: StatementElement): StatementElement {
    const child = new StatementElement(parent.selectedObjectNode as NodeValue, parent.statementLevel + 1, parent);
    const statements = this.currentStatements;
    const subtree = this.descendantsOf(parent);
    const lastOfSubtree = subtree.length ? subtree[subtree.length - 1] : parent;
    const insertIndex = statements.findIndex(s => s.id === lastOfSubtree.id) + 1;
    this._setStatements([...statements.slice(0, insertIndex), child, ...statements.slice(insertIndex)]);
    return child;
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
    // Remove the statement and its whole subtree (any depth), not just direct children.
    const toRemove = new Set([statement.id, ...this.descendantsOf(statement).map(s => s.id)]);
    this._setStatements(this.currentStatements.filter(stm => !toRemove.has(stm.id)));
  }

  setSelectedPredicate(statement: StatementElement, selectedProperty: Predicate): void {
    statement.selectedPredicate = selectedProperty;
    this._updateStatement(statement);
    // Changing the predicate resets the operator/object (see StatementElement setter), so a statement
    // that used to open a sub-query may no longer do so — drop any now-orphaned subcriteria.
    this._pruneChildrenIfNotSubQuery(statement);
  }

  setSelectedOperator(statement: StatementElement, selectedOperator: Operator): void {
    statement.selectedOperator = selectedOperator;
    this._updateStatement(statement);
    this._pruneChildrenIfNotSubQuery(statement);
  }

  addBlankStatement(): StatementElement {
    const blank = this._makeRootStatement();
    this._setStatements([...this.currentStatements, blank]);
    return blank;
  }

  setObjectValue(statement: StatementElement, searchValue: string | IriLabelPair): void {
    statement.selectedObjectValue = searchValue;
    this._updateStatement(statement);
    this._pruneChildrenIfNotSubQuery(statement);
  }

  /** Replace a statement in place by id. */
  private _updateStatement(statement: StatementElement): void {
    this._setStatements(this.currentStatements.map(p => (p.id === statement.id ? statement : p)));
  }

  /**
   * When a statement no longer opens a sub-query (operator/predicate changed away from link + Matches,
   * or its resource class was cleared), its subcriteria are meaningless — remove the whole subtree.
   */
  private _pruneChildrenIfNotSubQuery(statement: StatementElement): void {
    if (statement.objectType === PropertyObjectType.ResourceObject) return;
    const toRemove = new Set(this.descendantsOf(statement).map(s => s.id));
    if (toRemove.size === 0) return;
    this._setStatements(this.currentStatements.filter(s => !toRemove.has(s.id)));
  }
}
