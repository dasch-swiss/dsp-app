import { Injectable } from '@angular/core';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { LoadListsInProjectAction } from './lists.actions';
import { ListsSelectors } from './lists.selectors';

@Injectable({ providedIn: 'root' })
export class ListsFacade {
  constructor(private _store: Store) {}

  getListsInProject$(): Observable<ListNodeInfo[]> {
    const projectIri = this._store.selectSnapshot(ProjectsSelectors.currentProject)!.id;
    return combineLatest([
      this._store.select(ListsSelectors.isListsLoaded),
      this._store.select(ListsSelectors.isListsLoading),
    ]).pipe(
      distinctUntilChanged(),
      tap(([loaded, loading]) => {
        if (!loaded && !loading) {
          this._store.dispatch(new LoadListsInProjectAction(projectIri));
        }
      }),
      switchMap(() => this._store.select(ListsSelectors.listsInProject))
    );
  }
}
