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
