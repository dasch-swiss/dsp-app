import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CanDo } from '../ontology-map/data-model-editor';

/** How long the pointer rests on a row before its check is asked: sweeping across rows asks nothing. */
export const CHECK_DELAY_MS = 400;

/**
 * What the API says of an action on each item (deleting a class, a property, a data model), asked once per item and
 * kept until `clear()`, which a page calls once the data model is read again after an edit. A check the API could not
 * answer is shown but not kept, so the next hover asks again.
 */
export class CanDoChecks {
  readonly results = signal(new Map<string, CanDo>());
  private readonly _asked = new Set<string>();
  private _pending?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly _ask: (key: string) => Observable<CanDo>,
    private readonly _destroyRef: DestroyRef
  ) {
    _destroyRef.onDestroy(() => clearTimeout(this._pending));
  }

  /** Asks now, unless asked already. */
  check(key: string): void {
    this.cancel();
    if (this._asked.has(key)) return;
    this._asked.add(key);
    this._ask(key)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(result => {
        if (result.failed) this._asked.delete(key);
        this.results.update(results => new Map(results).set(key, result));
      });
  }

  /** Asks once the pointer has rested on the item a moment; `cancel()` when it leaves. */
  checkSoon(key: string): void {
    this.cancel();
    if (this._asked.has(key)) return;
    this._pending = setTimeout(() => this.check(key), CHECK_DELAY_MS);
  }

  cancel(): void {
    clearTimeout(this._pending);
  }

  /** Forgets every answer: after an edit, what was true may no longer be. */
  clear(): void {
    this.cancel();
    this._asked.clear();
    this.results.set(new Map());
  }
}
