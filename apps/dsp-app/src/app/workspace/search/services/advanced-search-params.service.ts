import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/*
 * represents the parameters of an advanced search.
 */
export class AdvancedSearchParams {
    /**
     *
     * @param generateGravsearch a function that generates a Gravsearch query.
     *
     * The function takes the offset
     * as a parameter and returns a Gravsearch query string.
     * Returns false if not set correctly (init state).
     */
    constructor(
        public generateGravsearch: (offset: number) => string | boolean
    ) {}
}

@Injectable({
    providedIn: 'root',
})
export class AdvancedSearchParamsService {
    private _currentSearchParams;

    constructor() {
        // init with a dummy function that returns false
        // if the application is reloaded, this will be returned
        this._currentSearchParams = new BehaviorSubject<AdvancedSearchParams>(
            new AdvancedSearchParams((offset: number) => false)
        );
    }

    /**
     * updates the parameters of an advanced search.
     *
     * @param searchParams new advanced search params.
     */
    changeSearchParamsMsg(searchParams: AdvancedSearchParams): void {
        this._currentSearchParams.next(searchParams);
    }

    /**
     * gets the search params of an advanced search.
     *
     */
    getSearchParams(): AdvancedSearchParams {
        return this._currentSearchParams.getValue();
    }
}
