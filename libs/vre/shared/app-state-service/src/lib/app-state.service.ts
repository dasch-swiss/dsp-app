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
     * gets the value from a state if the key is provided
     * @param key Key is the id of the content
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
            const content = this._applicationState.get(key);
            // content should never be undefined but we'll check anyway
            // if it is undefined, it means the app is in an invalid state
            if (content === undefined) {
                return throwError(
                    'Requested key "' +
                        key +
                        '" has value of undefined in the application state'
                );
            } else {
                return of(content.value);
            }
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
     * @param key Key is the id of the content
     * @param value Value is the content
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
     * @param key Key is the id of the content
     */
    has(key: string): boolean {
        return this._applicationState.has(key);
    }

    /**
     * delete a states content by key
     * @param key Key is the id of the content
     */
    delete(key: string) {
        this._applicationState.delete(key);
    }

    /**
     * clear the whole application state
     */
    destroy() {
        this._applicationState.clear();
    }
}
