import { BehaviorSubject } from 'rxjs';

export class DataBrowserPageService {
  private _reloadNavigationSubject = new BehaviorSubject(null);
  onNavigationReload$ = this._reloadNavigationSubject.asObservable();

  reloadNavigation() {
    this._reloadNavigationSubject.next(null);
  }
}
