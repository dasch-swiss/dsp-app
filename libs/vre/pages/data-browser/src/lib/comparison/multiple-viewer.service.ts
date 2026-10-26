import { Injectable } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { BehaviorSubject, Subject } from 'rxjs';

/** Selection is compared by `ReadResource.id`, never by object identity: a re-query builds fresh instances. */
@Injectable()
export class MultipleViewerService {
  private _selectedResourcesSubject = new BehaviorSubject<ReadResource[]>([]);
  selectedResources$ = this._selectedResourcesSubject.asObservable();

  selectMode = false;

  searchKeyword?: string;

  private _resourceChangedSubject = new Subject<string>();

  /** The IRI of a resource changed outside the viewer showing it; the viewer re-reads it from dsp-api rather than trusting a handed-over resource. */
  resourceChanged$ = this._resourceChangedSubject.asObservable();

  notifyResourceChanged(resourceIri: string) {
    this._resourceChangedSubject.next(resourceIri);
  }

  /** Every emission is a new array, never the previous one mutated: reference comparisons (`signal.set`, `distinctUntilChanged`) must see the change. */
  addResources(resources: ReadResource[]) {
    const currentResources = this._selectedResourcesSubject.getValue();
    // Ticking a checkbox replaces a lone click-selection rather than adding to it.
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
