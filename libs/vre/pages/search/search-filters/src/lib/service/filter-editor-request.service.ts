import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Asks the chip bar to open its filter editor on a predicate. The Data tab's table headers and the bar share no
 * parent/child link, and routing through the bar guarantees a property never gets two filters (it re-opens the
 * existing chip).
 *
 * A plain `Subject`, not a `BehaviorSubject`: a replayed command would re-open the editor on every new subscription.
 */
@Injectable()
export class FilterEditorRequestService {
  private readonly _requests = new Subject<string>();

  /** Predicate IRIs the host page has asked the bar to open an editor for. */
  readonly requests$: Observable<string> = this._requests.asObservable();

  open(predicateIri: string): void {
    this._requests.next(predicateIri);
  }
}
