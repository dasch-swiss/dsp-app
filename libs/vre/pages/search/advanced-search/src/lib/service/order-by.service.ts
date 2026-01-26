import { Injectable, inject, OnDestroy } from '@angular/core';
import { distinctUntilChanged, map, skip, Subject, takeUntil } from 'rxjs';
import { OrderByItem } from '../model';
import { SearchStateService } from './search-state.service';

@Injectable()
export class OrderByService implements OnDestroy {
  private _searchStateService = inject(SearchStateService);
  private _destroy$ = new Subject<void>();

  orderByItems$ = this._searchStateService.orderByItems$;

  availablePredicates$ = this._searchStateService.completeStatements$.pipe(
    map(
      elements =>
        new Map(
          elements.map(stmt => [
            stmt.id,
            { label: stmt.selectedPredicate!.label, isLinkProperty: stmt.selectedPredicate!.isLinkProperty },
          ])
        )
    ),
    distinctUntilChanged()
  );

  get currentOrderBy() {
    return this._searchStateService.currentState.orderBy;
  }

  constructor() {
    this.availablePredicates$
      .pipe(
        skip(1), // Skip initial emission to prevent circular update
        takeUntil(this._destroy$)
      )
      .subscribe(availablePredicates => {
        const nextOrderBy = this._computeNextOrderBy(availablePredicates);

        if (!this._orderByArraysEqual(this.currentOrderBy, nextOrderBy)) {
          this._searchStateService.patchState({ orderBy: nextOrderBy });
        }
      });
  }

  updateOrderBy(orderByItems: OrderByItem[]): void {
    this._searchStateService.updateOrderBy(orderByItems);
  }

  private _computeNextOrderBy(
    availablePredicates: Map<string, { label: string; isLinkProperty: boolean }>
  ): OrderByItem[] {
    const toKeep = this.currentOrderBy.filter(item => availablePredicates.has(item.id));

    const toAdd = [...availablePredicates]
      .filter(([id]) => !toKeep.some(i => i.id === id))
      .map(([id, info]) => new OrderByItem(id, info.label, info.isLinkProperty));

    return [...toKeep, ...toAdd];
  }

  private _orderByArraysEqual(arr1: OrderByItem[], arr2: OrderByItem[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, i) => arr2[i]?.id === item.id && arr2[i]?.orderBy === item.orderBy);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
