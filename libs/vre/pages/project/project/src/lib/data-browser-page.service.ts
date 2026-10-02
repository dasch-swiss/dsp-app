import { BehaviorSubject } from 'rxjs';

export class DataBrowserPageService {
  private _reloadNavigationSubject = new BehaviorSubject(null);
  onNavigationReload$ = this._reloadNavigationSubject.asObservable();

  /**
   * The class whose entry behaviour the result panel has already run.
   *
   * Auto-selecting the first result is an *entry* behaviour: it is what makes the viewer show
   * something when a class is clicked in the sidenav. It must not run again when the user merely
   * switches between List and Table — but both fetchers are destroyed and recreated by that
   * switch, so a component field has no memory of it and the list would re-select its first row
   * over whatever the user had open in the table (REQ-5.5).
   *
   * Page-scoped, so it outlives both fetchers and still distinguishes one class from the next.
   * Written by whichever view is mounted; the table writes it without selecting anything, because
   * "the viewer stays collapsed" is that view's entry behaviour (REQ-5.3) and is just as resolved.
   */
  selectionResolvedForClass: string | null = null;

  reloadNavigation() {
    this._reloadNavigationSubject.next(null);
  }
}
