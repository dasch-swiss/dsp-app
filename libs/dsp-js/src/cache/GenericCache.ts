import { Observable, of } from 'rxjs';
import { map, shareReplay, take, tap } from 'rxjs';
import { ApiResponseError } from '../models/api-response-error';

/**
 * Generic cache class.
 * Fetches information of a specific type from Knora once and caches it.
 * Fetches also dependencies of a requested element (non-blocking).
 * Works also with multiple async requests for the same key, also if not cached yet.
 *
 * @category Internal
 */
export abstract class GenericCache<T> {
  /**
   * Cache object: key -> value.
   */
  private cache: { [key: string]: Observable<T> } = {};

  /**
   * Gets a specific item from the cache.
   * If not cached yet, the information will be retrieved from DSP-API.
   *
   * @param key the id of the item to be returned.
   * @param isDependency true if the item to be returned
   *        is a dependency of another item (recursive call to this method).
   */
  protected getItem(key: string, isDependency = false): Observable<T> {
    // If the key already exists,
    // return the associated Observable.
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }

    // store the observable in the cache
    // the next request for the same key will immediately get the observable
    // also if the request has not finished yet
    this.cache[key] = this.requestItemFromKnora(key, isDependency).pipe(
      // only one item is expected
      take(1),
      // DSP-API may return several elements for the request (optimization)
      tap((items: T[]) => {
        if (items.length === 0) throw Error(`No items returned from DSP-API for ${key}`);

        // the first item is expected to be the requested item
        if (key !== this.getKeyOfItem(items[0]))
          throw Error(`First item of items returned from DSP-API is expected to be {$key}`);

        // save all additional items returned for this request
        this.saveAdditionalItems(items.slice(1));
        // request dependencies of all items
        this.requestDependencies(items);
      }),
      // only write the requested item to the cache for the given key
      map((res: T[]) => res[0]),
      // make it a `ReplaySubject` so that all subscribers
      // will get the latest and only emitted value
      //
      // side effects (dependency handling, optimization) will only be performed once
      //
      // failed observables will be retried upon the next subscription
      shareReplay({ refCount: false, bufferSize: 1 })
    );

    // return the observable immediately (sync)
    return this.cache[key];
  }

  /**
   * Deletes an existing entry in the cache and requests information from DSP-API.
   *
   * @param key the id of the information to be returned.
   * @return the item.
   */
  protected reloadItem(key: string): Observable<T> {
    if (this.cache[key] !== undefined) delete this.cache[key];
    return this.getItem(key);
  }

  /**
   * Fetches information from DSP-API.
   *
   * @param key the id of the information to be returned.
   * @param isDependency true if the requested key is a dependency of another item.
   * @return the items received from DSP-API.
   */
  protected abstract requestItemFromKnora(key: string, isDependency: boolean): Observable<T[]>;

  /**
   * Given an item, determines its key.
   *
   * @param item The item whose key has to be determined.
   */
  protected abstract getKeyOfItem(item: T): string;

  /**
   * Given an item, determines its dependencies on other items.
   *
   * @param item the item whose dependencies have to be determined.
   * @return keys of the items the current item relies on.
   */
  protected abstract getDependenciesOfItem(item: T): string[];

  /**
   * Handle additional items that were resolved with a request.
   *
   * @param items dependencies that have been retrieved.
   */
  private saveAdditionalItems(items: T[]) {
    // Write all available items to the cache (only for non existing keys)
    // Analyze dependencies of available items.
    items.forEach((item: T) => {
      // Get key of item
      const itemKey = this.getKeyOfItem(item);

      // Only write an additional item to the cache
      // if there is not entry for it yet
      // item for `key` has already been handled
      if (this.cache[itemKey] === undefined) {
        this.cache[itemKey] = of(item);
      }
    });
  }

  /**
   * Requests dependencies of the items retrieved from DSP-API.
   *
   * @param items items returned from DSP-API to a request.
   */
  private requestDependencies(items: T[]) {
    items.forEach((item: T) => {
      // get items this item depends on
      this.getDependenciesOfItem(item)
        .filter((depKey: string) => {
          // ignore dependencies already taken care of
          return Object.keys(this.cache).indexOf(depKey) === -1;
        })
        .forEach((depKey: string) => {
          // Request each dependency from the cache
          // Dependencies will be fetched independently (non-blocking).
          // Subscribe because the Observable is lazy
          this.getItem(depKey, true).subscribe();
        });
    });
  }
}
