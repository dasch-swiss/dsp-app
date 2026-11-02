import { BehaviorSubject } from 'rxjs';

export class DataBrowserPageService {
  private _reloadNavigationSubject = new BehaviorSubject(null);
  onNavigationReload$ = this._reloadNavigationSubject.asObservable();

  /**
   * The class whose entry behaviour (auto-selecting the first result) has already run. Page-scoped
   * because both fetchers are recreated on a List/Table switch, which must not re-select a row.
   */
  selectionResolvedForClass: string | null = null;

  reloadNavigation() {
    this._reloadNavigationSubject.next(null);
  }
}
