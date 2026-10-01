import { Injectable } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { BehaviorSubject } from 'rxjs';

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

  addResources(resources: ReadResource[]) {
    const currentResources = this._selectedResourcesSubject.getValue();
    if (!this.selectMode && currentResources.length === 1) {
      currentResources.length = 0; // Clear the previous single selection if switching to multi-mode
    }

    resources.forEach(resource => {
      if (!currentResources.some(selected => selected.id === resource.id)) {
        currentResources.push(resource);
      }
    });
    this._selectedResourcesSubject.next(currentResources);

    this.selectMode = true;
  }

  removeResources(resources: ReadResource[]) {
    const currentResources = this._selectedResourcesSubject.getValue();

    resources.forEach(resource => {
      const index = currentResources.findIndex(selected => selected.id === resource.id);
      if (index < 0) {
        return;
      }

      currentResources.splice(index, 1);
    });

    this._selectedResourcesSubject.next(currentResources);
    this.selectMode = currentResources.length > 0;
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
