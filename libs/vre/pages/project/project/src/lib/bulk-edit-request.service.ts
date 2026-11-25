import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Carries a bulk edit asked for elsewhere on the class page (a table column's header) to the results bar,
 * which knows which resources it covers: the ticked rows, else everything the search keeps.
 * Component scoped, provided by the class view.
 */
@Injectable()
export class BulkEditRequestService {
  private readonly _requests = new Subject<string>();

  /** The property the bulk edit panel should open on. */
  readonly requests$: Observable<string> = this._requests.asObservable();

  request(property: string): void {
    this._requests.next(property);
  }
}
