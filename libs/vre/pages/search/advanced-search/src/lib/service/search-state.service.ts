import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, startWith } from 'rxjs';
import { SEARCH_ALL_RESOURCE_CLASSES_OPTION } from '../constants';
import { IriLabelPair, StatementElement, OrderByItem, SearchFormsState } from '../model';

@Injectable()
export class SearchStateService {
  private readonly INITIAL_FORMS_STATE: SearchFormsState = {
    selectedResourceClass: SEARCH_ALL_RESOURCE_CLASSES_OPTION as IriLabelPair,
    statementElements: [new StatementElement()],
    orderBy: [],
  } as const;

  private _state = new BehaviorSubject<SearchFormsState>(this.INITIAL_FORMS_STATE);

  selectedResourceClass$ = this._state.pipe(
    distinctUntilChanged(),
    map(state => state.selectedResourceClass)
  );

  statementElements$ = this._state.pipe(
    map(state => state.statementElements),
    distinctUntilChanged(),
    startWith(this.INITIAL_FORMS_STATE.statementElements)
  );

  completeStatements$ = this._state.pipe(
    distinctUntilChanged(),
    map(state => state.statementElements),
    map(elements => elements.filter(prop => prop.isValidAndComplete)),
    distinctUntilChanged()
  );

  orderByItems$ = this._state.pipe(
    distinctUntilChanged(),
    map(state => state.orderBy),
    distinctUntilChanged()
  );

  isFormStateValidAndComplete$ = this._state.pipe(
    distinctUntilChanged(),
    map(state => state.statementElements),
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
