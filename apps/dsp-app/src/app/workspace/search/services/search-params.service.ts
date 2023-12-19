import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/*
 * represents the parameters of an advanced search.
 */
export class GravsearchSearchParams {
  /**
   *
   * @param generateGravsearch a function that generates a Gravsearch query.
   *
   * The function takes the offset
   * as a parameter and returns a Gravsearch query string.
   * Returns false if not set correctly (init state).
   */
  constructor(public generateGravsearch: (offset: number) => string | boolean) {}
}

@Injectable({
  providedIn: 'root',
})
export class SearchParamsService {
  private _currentSearchParams;

  constructor() {
    // init with a dummy function that returns false
    // if the application is reloaded, this will be returned
    this._currentSearchParams = new BehaviorSubject<GravsearchSearchParams>(new GravsearchSearchParams(() => false));
  }

  /**
   * updates the parameters of an advanced search.
   *
   * @param searchParams new advanced search params.
   */
  changeSearchParamsMsg(searchParams: GravsearchSearchParams): void {
    this._currentSearchParams.next(searchParams);
  }

  /**
   * gets the search params of an advanced search.
   *
   */
  getSearchParams(): GravsearchSearchParams {
    return this._currentSearchParams.getValue();
  }
}
