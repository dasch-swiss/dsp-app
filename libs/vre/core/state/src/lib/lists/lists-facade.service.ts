import { Injectable } from '@angular/core';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { Store } from '@ngxs/store';
import { Observable, combineLatest, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { LoadListsInProjectAction } from './lists.actions';
import { ListsSelectors } from './lists.selectors';

@Injectable({ providedIn: 'root' })
export class ListsFacade {
  constructor(private _store: Store) {}

  getListsInProject$(): Observable<ListNodeInfo[]> {
    return combineLatest([
      this._store.select(ProjectsSelectors.currentProject),
      this._store.select(ListsSelectors.isListsLoaded),
      this._store.select(ListsSelectors.isListsLoading),
    ]).pipe(
      distinctUntilChanged(),
      tap(([project, loaded, loading]) => {
        if (project && !loaded && !loading) {
          this._store.dispatch(new LoadListsInProjectAction(project.id));
        }
      }),
      switchMap(([project]) => this._store.select(ListsSelectors.listsInProject))
    );
  }
}
