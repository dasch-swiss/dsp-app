import { Injectable } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ApiServiceError } from '@knora/core';


interface CacheContent {
    expiry: number;
    value: any;
}


@Injectable({
    providedIn: 'root'
})
/**
 * Cache Service is an observables based in-memory cache implementation
 * Keeps track of in-flight observables and sets a default expiry for cached values
 * @export
 * @class CacheService
 */
export class CacheService {
    private cache: Map<string, CacheContent> = new Map<string, CacheContent>();
    private inFlightObservables: Map<string, Subject<any>> = new Map<string, Subject<any>>();
    readonly DEFAULT_MAX_AGE: number = 3600000;  // 3600000ms => 1 Stunde

    /**
     * Gets the value from cache if the key is provided.
     * If no value exists in cache, then check if the same call exists
     * in flight, if so return the subject. If not create a new
     * Subject inFlightObservable and return the source observable.
     */
    get(key: string, fallback?: Observable<any>, maxAge?: number): Observable<any> | Subject<any> {

        if (this.hasValidCachedValue(key)) {
            // console.log(`%c Getting from cache by key: ${key}`, 'color: green');
            // console.log(`%c Cache returns:` + JSON.stringify(this.cache.get(key).value), 'color: green');
            // console.log(`%c Cache returns typeof:` + (typeof of(this.cache.get(key).value)), 'color: green');

            // returns observable
            return of(this.cache.get(key).value);
        }

        if (!maxAge) {
            maxAge = this.DEFAULT_MAX_AGE;
        }

        if (this.inFlightObservables.has(key)) {
            // console.log(`%c inFlightObservables has key: ${key}`, 'color: orange');
            // console.log(`%c inFlightObservables returns:` + JSON.stringify(this.inFlightObservables.get(key)), 'color: orange');
            // console.log(`%c inFlightObservables returns typeof:` + (typeof this.inFlightObservables.get(key)), 'color: orange');

            return this.inFlightObservables.get(key);

        } else if (fallback && fallback instanceof Observable) {
            this.inFlightObservables.set(key, new Subject());

            fallback.subscribe(
                (value: any) => {
                    this.set(key, value, maxAge);
                    // console.log(`%c Calling api for key: ${key}`, 'color: purple');
                    // console.log(`%c Calling api returns:` + JSON.stringify(value), 'color: purple');
                    // console.log(`%c Calling api returns typeof:` + (typeof value), 'color: purple');

                    return value;
                },
                (error: ApiServiceError) => {
                    // api service error
                    console.error(error);
                });

        } else {
            return throwError('Requested key is not available in Cache');
        }

    }

    /**
     * Sets the value with key in the cache
     * Notifies all observers of the new value
     */
    set(key: string, value: any, maxAge: number = this.DEFAULT_MAX_AGE): void {
        this.cache.set(key, {value: value, expiry: Date.now() + maxAge});
        this.notifyInFlightObservers(key, value);
    }

    /**
     * Checks if the key exists in cache
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * delete a cached content by key
     * @param key
     */
    del(key: string) {
        this.cache.delete(key);
    }

    /**
     * Clear the whole cache
     */
    destroy() {
        sessionStorage.clear();
        this.cache.clear();
    }

    /**
     * Publishes the value to all observers of the given
     * in progress observables if observers exist.
     */
    private notifyInFlightObservers(key: string, value: any): void {
        if (this.inFlightObservables.has(key)) {
            const inFlight = this.inFlightObservables.get(key);
            const observersCount = inFlight.observers.length;
            if (observersCount) {
                // console.log(`%cNotifying ${inFlight.observers.length} flight subscribers for ${key}`, 'color: blue');
                inFlight.next(value);
            }
            inFlight.complete();
            this.inFlightObservables.delete(key);
        }
    }

    /**
     * Checks if the key exists and   has not expired.
     */
    private hasValidCachedValue(key: string): boolean {
        if (this.cache.has(key)) {
            if (this.cache.get(key).expiry < Date.now()) {
                this.cache.delete(key);
                return false;
            }
            return true;
        } else {
            return false;
        }
    }
}
