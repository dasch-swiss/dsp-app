import { Injectable } from '@angular/core';
import {
    ReadUser,
    ReadProject,
    ReadOntology,
    ReadGroup,
    ListNodeInfo,
} from '@dasch-swiss/dsp-js';
import { Observable, of, throwError } from 'rxjs';

interface StateContent {
    value:
        | ReadUser
        | ReadUser[]
        | ReadProject
        | ReadOntology
        | ReadOntology[]
        | ReadGroup[]
        | ListNodeInfo[];
}

@Injectable({
    providedIn: 'root',
})
/**
 * Application State Service is an observables based in-memory state implementation
 * Used to keep track of the state of the application
 * @export
 * @class ApplicationStateService
 */
export class ApplicationStateService {
    private _applicationState: Map<string, StateContent> = new Map<
        string,
        StateContent
    >();

    /**
     * gets the value from a state if the key is provided.
     */
    get(
        key: string
    ): Observable<
        | ReadUser
        | ReadUser[]
        | ReadProject
        | ReadOntology
        | ReadOntology[]
        | ReadGroup[]
        | ListNodeInfo[]
    > {
        if (this.has(key)) {
            return of(this._applicationState.get(key).value);
        } else {
            return throwError(
                'Requested key "' +
                    key +
                    '" is not available in the application state'
            );
        }
    }

    /**
     * sets the value with key in the application state
     */
    set(
        key: string,
        value:
            | ReadUser
            | ReadUser[]
            | ReadProject
            | ReadOntology
            | ReadOntology[]
            | ReadGroup[]
            | ListNodeInfo[]
    ): void {
        this._applicationState.set(key, { value: value });
    }

    /**
     * checks if the key exists in the application state
     */
    has(key: string): boolean {
        return this._applicationState.has(key);
    }

    /**
     * delete a states content by key
     * @param key Key is the id of the content
     */
    del(key: string) {
        this._applicationState.delete(key);
    }

    /**
     * clear the whole application state
     */
    destroy() {
        sessionStorage.clear();
        this._applicationState.clear();
    }
}
