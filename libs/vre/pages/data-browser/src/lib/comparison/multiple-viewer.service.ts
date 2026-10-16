import { Injectable } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * Selection is compared by `ReadResource.id`, never by object identity.
 *
 * Every re-query builds fresh `ReadResource` instances, so after a filter change the resource the
 * user has open is a different object with the same IRI. Under identity comparison it stopped
 * counting as selected: it rendered unselected in the list and `removeResources` could not find it
 * to take it out of the comparison set.
 */
@Injectable()
export class MultipleViewerService {
  private _selectedResourcesSubject = new BehaviorSubject<ReadResource[]>([]);
  selectedResources$ = this._selectedResourcesSubject.asObservable();

  selectMode = false;

  searchKeyword?: string;

  private _resourceChangedSubject = new Subject<string>();

  /**
   * The IRI of a resource that was changed somewhere other than in the viewer showing it.
   *
   * The Data tab's table edits a value in a cell, under a `ResourceFetcherService` scoped to that
   * row — a different instance from the one the viewer owns. Without this the viewer would keep
   * rendering the value the user has just replaced, side by side with the table cell showing the
   * new one (DEV-7466).
   *
   * Deliberately an IRI and not the reloaded resource: the viewer re-reads from dsp-api rather
   * than trusting a resource handed to it, so what it shows is the stored state and not one
   * component's idea of it.
   */
  resourceChanged$ = this._resourceChangedSubject.asObservable();

  notifyResourceChanged(resourceIri: string) {
    this._resourceChangedSubject.next(resourceIri);
  }

  /**
   * Every emission is a new array, never the previous one mutated.
   *
   * These two used to `push` and `splice` the array they had just read out of the subject and
   * re-emit that same reference. A `BehaviorSubject` forwards it regardless, so an async pipe
   * still updated and the list view looked correct — but anything comparing by reference saw
   * nothing happen: a `signal.set` of the same array is `Object.is`-equal and notifies no one,
   * and `distinctUntilChanged` swallows it. That is what left the Data tab's table unable to see
   * its own checkboxes being ticked (DEV-7466).
   */
  addResources(resources: ReadResource[]) {
    const currentResources = this._selectedResourcesSubject.getValue();
    // A single click-selection is not the start of a comparison set — it is the thing the viewer
    // is showing. Ticking a checkbox turns one into the other, and the click-selection goes.
    const base = !this.selectMode && currentResources.length === 1 ? [] : currentResources;
    const added = resources.filter(resource => !base.some(selected => selected.id === resource.id));

    this._selectedResourcesSubject.next([...base, ...added]);
    this.selectMode = true;
  }

  removeResources(resources: ReadResource[]) {
    const remaining = this._selectedResourcesSubject
      .getValue()
      .filter(selected => !resources.some(resource => resource.id === selected.id));

    this._selectedResourcesSubject.next(remaining);
    this.selectMode = remaining.length > 0;
  }

  selectOneResource(resource: ReadResource) {
    this._selectedResourcesSubject.next([resource]);
    this.selectMode = false;
  }

  reset() {
    this.selectMode = false;
    this._selectedResourcesSubject.next([]);
  }
}
