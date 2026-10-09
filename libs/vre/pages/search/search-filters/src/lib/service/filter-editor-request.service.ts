import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * A channel for asking the chip bar to open its filter editor on a given predicate.
 *
 * Exists because the Data tab's table headers and the chip bar are not in a parent/child
 * relationship: the bar sits in the class header above the split, the table in the result panel
 * below it, and their nearest common ancestor knows about neither. A column's filter control
 * therefore cannot reach the bar with an output.
 *
 * Routing the request to the bar rather than letting the header mount its own editor is what makes
 * PRD REQ-3.7 true by construction: the bar is the one place that knows which chips already exist,
 * so it can re-open the chip on that predicate instead of minting a second filter on the same
 * property. A header-owned popover would have to reimplement that check — and the whole
 * confirm-and-persist path with it.
 *
 * A plain `Subject`, not a `BehaviorSubject`: this is a command, and a replayed one would re-open
 * the editor every time something new subscribes.
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
