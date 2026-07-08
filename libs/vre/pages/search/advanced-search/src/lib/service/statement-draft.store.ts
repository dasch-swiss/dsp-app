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

  // IDs of statements that are *editing clones* — a detached copy of a confirmed filter's subtree that
  // the popover mutates in isolation. They live in `_statements` so the recursive field editors can
  // address them by id, but are excluded from the confirmed-chip projection and from URL writes until
  // committed. Editing a confirmed chip must not change the displayed chip until the user confirms.
  private readonly _editingIds = new Set<string>();

  /** True when the statement is an uncommitted editing clone (not part of the confirmed/displayed set). */
  isEditing(statement: StatementElement): boolean {
    return this._editingIds.has(statement.id);
  }

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
    // A URL reseed mints fresh reconstructed instances (new ids) and represents the committed truth, so
    // any in-flight editing draft (whose ids are now gone) is abandoned — drop the stale editing flags.
    this._editingIds.clear();
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
    // A subcriterion inherits its parent's editing flag: while a new/edited filter is being built in the
    // popover, its whole subtree must stay out of the chip row and URL until commit.
    if (this._editingIds.has(parent.id)) this._editingIds.add(child.id);
    const statements = this.currentStatements;
    const subtree = this.descendantsOf(parent);
    const lastOfSubtree = subtree.length ? subtree[subtree.length - 1] : parent;
    const insertIndex = statements.findIndex(s => s.id === lastOfSubtree.id) + 1;
    this._setStatements([...statements.slice(0, insertIndex), child, ...statements.slice(insertIndex)]);
    return child;
  }

  /**
   * Begin an isolated edit of a confirmed statement: deep-clone its whole subtree (fresh ids, so it is a
   * distinct instance set), insert the clone into the store, and flag every clone node as "editing" so it
   * is kept out of the chip row and URL until committed. The popover edits the returned clone root; the
   * original (and its chip) stay untouched. Returns the clone root to bind the popover to.
   */
  beginEdit(source: StatementElement): StatementElement {
    const clones = this._cloneSubtree(source);
    clones.forEach(c => this._editingIds.add(c.id));
    this._setStatements([...this.currentStatements, ...clones]);
    return clones[0];
  }

  /**
   * Commit an isolated edit: drop the original subtree, promote the clone by clearing its editing flags,
   * so it becomes the confirmed statement. The caller then persists to the URL, which re-seeds the store
   * from scratch anyway — commit only needs to make the clone the live, displayed statement meanwhile.
   */
  commitEdit(cloneRoot: StatementElement, original: StatementElement): void {
    const cloneIds = [cloneRoot.id, ...this.descendantsOf(cloneRoot).map(s => s.id)];
    cloneIds.forEach(id => this._editingIds.delete(id));
    const originalIds = new Set([original.id, ...this.descendantsOf(original).map(s => s.id)]);
    this._setStatements(this.currentStatements.filter(s => !originalIds.has(s.id)));
  }

  /** Cancel an isolated edit: discard the clone subtree; the original (and its chip) is unaffected. */
  cancelEdit(cloneRoot: StatementElement): void {
    const cloneIds = [cloneRoot.id, ...this.descendantsOf(cloneRoot).map(s => s.id)];
    cloneIds.forEach(id => this._editingIds.delete(id));
    this._setStatements(this.currentStatements.filter(s => !cloneIds.includes(s.id)));
  }

  /**
   * Deep-clone a statement and its subtree into fresh instances (new ids), preserving predicate/operator/
   * value and rewiring parent links among the clones. Returns the clones in parent-before-child order,
   * clone root first.
   */
  private _cloneSubtree(source: StatementElement): StatementElement[] {
    const flat = [source, ...this.descendantsOf(source)];
    const byOldId = new Map<string, StatementElement>();
    const result: StatementElement[] = [];
    for (const orig of flat) {
      const parentClone = orig.parentId ? byOldId.get(orig.parentId) : undefined;
      const clone = new StatementElement(orig.subjectNode, orig.statementLevel, parentClone);
      if (orig.selectedPredicate) clone.selectedPredicate = orig.selectedPredicate;
      if (orig.selectedOperator) clone.selectedOperator = orig.selectedOperator;
      if (orig.selectedObjectValue !== undefined) clone.selectedObjectValue = orig.selectedObjectValue;
      byOldId.set(orig.id, clone);
      result.push(clone);
    }
    return result;
  }

  /** Set the tree with a new array reference so `statements$` emits. */
  private _setStatements(statements: StatementElement[]): void {
    this._statements.next([...statements]);
  }

  setMainResource(resourceClass: IriLabelPair): void {
    // Reset the ephemeral editing tree to a single root statement seeded with the new class. The
    // selected class + orderBy are URL params owned by resource-class-chip (`writeState`), not here.
    // Resetting the tree abandons any in-flight editing draft, so drop stale editing flags too.
    this._editingIds.clear();
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

  /**
   * Start a new filter: append a blank root statement flagged as "editing" so it — and any subcriteria it
   * grows while being built in the popover — stays out of the chip row and URL until the user clicks Add
   * ({@link commitNewFilter}). Cancelling removes it via {@link deleteStatement}.
   */
  addBlankStatement(): StatementElement {
    const blank = this._makeRootStatement();
    this._editingIds.add(blank.id);
    this._setStatements([...this.currentStatements, blank]);
    return blank;
  }

  /** Commit a new filter (the Add click): clear editing flags on it and its subtree so it becomes a chip. */
  commitNewFilter(root: StatementElement): void {
    [root.id, ...this.descendantsOf(root).map(s => s.id)].forEach(id => this._editingIds.delete(id));
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
