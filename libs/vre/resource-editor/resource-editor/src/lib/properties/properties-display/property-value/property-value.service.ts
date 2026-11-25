import { inject, Injectable } from '@angular/core';
import {
  Cardinality,
  ListNodeV2WithAllLanguages,
  ReadResource,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { ListCacheService } from './list-cache.service';

@Injectable()
export class PropertyValueService {
  private _editModeData!: { resource: ReadResource; values: ReadValue[] };
  propertyDefinition!: ResourcePropertyDefinitionWithAllLanguages;
  cardinality!: Cardinality;
  lastOpenedItem$ = new BehaviorSubject<number | null>(null);

  /** The fallback is created here, in the injection context, because it injects the connection. */
  private readonly _lists = inject(ListCacheService, { optional: true }) ?? new ListCacheService();

  get editModeData(): { resource: ReadResource; values: ReadValue[] } {
    return this._editModeData;
  }

  set editModeData(data: { resource: ReadResource; values: ReadValue[] }) {
    this.lastOpenedItem$.next(null);
    this._editModeData = data;
  }

  /**
   * Returns the list rooted at `rootIri`, fetched once and shared across all of this property's
   * list values.
   */
  getList$(rootIri: string): Observable<ListNodeV2WithAllLanguages> {
    return this._lists.get$(rootIri);
  }

  toggleOpenedValue(index: number) {
    if (this.lastOpenedItem$.value === null || this.lastOpenedItem$.value !== index) {
      this.lastOpenedItem$.next(index);
    } else {
      this.lastOpenedItem$.next(null);
    }
  }
}
