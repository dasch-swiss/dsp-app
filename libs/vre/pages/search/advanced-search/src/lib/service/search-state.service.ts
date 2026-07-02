import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ALL_RESOURCE_CLASSES } from '../constants';
import { StatementElement, OrderByItem, SearchFormsState } from '../model';

@Injectable()
export class SearchStateService {
  private readonly INITIAL_FORMS_STATE: SearchFormsState = {
    selectedResourceClass: ALL_RESOURCE_CLASSES,
    statementElements: [new StatementElement()],
    orderBy: [],
  } as const;

  private _state = new BehaviorSubject<SearchFormsState>(this.INITIAL_FORMS_STATE);

  selectedResourceClass$ = this._state.pipe(
    map(state => state.selectedResourceClass),
    distinctUntilChanged((a, b) => a?.iri === b?.iri)
  );

  statementElements$ = this._state.pipe(
    map(state => state.statementElements),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((s, i) => s === b[i]))
  );

  completeStatements$ = this._state.pipe(
    map(state => state.statementElements),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((s, i) => s === b[i])),
    map(elements => elements.filter(prop => prop.isValidAndComplete))
  );

  orderByItems$ = this._state.pipe(
    map(state => state.orderBy),
    // Compare by value (id + orderBy flag), not reference: callers may mutate items in place,
    // which a reference check would silently swallow. See DEV-6576.
    distinctUntilChanged(
      (a, b) => a.length === b.length && a.every((x, i) => x.id === b[i]?.id && x.orderBy === b[i]?.orderBy)
    )
  );

  isFormStateValidAndComplete$ = this._state.pipe(
    map(state => state.statementElements),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((s, i) => s === b[i])),
    map(elements => {
      const allValid = elements.every(statement => statement.isValidAndComplete || statement.isPristine);
      const canSearch = elements.length > 1 || (elements.length === 1 && elements[0].isPristine);
      return allValid && canSearch;
    }),
    distinctUntilChanged()
  );

  get currentState(): SearchFormsState {
    return this._state.value;
  }

  get validStatementElements() {
    return this._state.value.statementElements.filter(statement => statement.isValidAndComplete);
  }

  patchState(state: Partial<SearchFormsState>) {
    const newState: SearchFormsState = {
      ...this._state.value,
      ...state,
      // Force new array reference for statementElements if provided
      ...(state.statementElements && {
        statementElements: [...state.statementElements],
      }),
    };
    this._state.next(newState);
  }

  clearAllSelections() {
    const emptyState: SearchFormsState = {
      ...this.INITIAL_FORMS_STATE,
      statementElements: [new StatementElement()],
    };
    this._state.next(emptyState);
  }

  updateStatement(statement: StatementElement) {
    this.patchState({
      statementElements: this._state.value.statementElements.map(p => (p.id === statement.id ? statement : p)),
    });
  }

  updateOrderBy(orderByItems: OrderByItem[]) {
    this.patchState({ orderBy: orderByItems });
  }
}
