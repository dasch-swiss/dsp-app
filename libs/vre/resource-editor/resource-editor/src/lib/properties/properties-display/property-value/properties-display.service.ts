import { BehaviorSubject, Observable } from 'rxjs';

export class PropertiesDisplayService {
  private readonly _SHOW_ALL_PROPERTIES_KEY = 'SHOW_ALL_PROPERTIES';
  private readonly _SHOW_ALL_COMMENTS_KEY = 'SHOW_ALL_COMMENTS';

  private _showAllProperties!: BehaviorSubject<boolean>;
  showAllProperties$!: Observable<boolean>;

  private _showComments!: BehaviorSubject<boolean>;
  showComments$!: Observable<boolean>;

  constructor() {
    const cachedAllPropsValue = localStorage.getItem(this._SHOW_ALL_PROPERTIES_KEY) === 'true';
    this._showAllProperties = new BehaviorSubject(cachedAllPropsValue);
    this.showAllProperties$ = this._showAllProperties.asObservable();

    const cachedAllCommentsValue = localStorage.getItem(this._SHOW_ALL_COMMENTS_KEY) === 'true';
    this._showComments = new BehaviorSubject(cachedAllCommentsValue);
    this.showComments$ = this._showComments.asObservable();
  }

  toggleShowProperties() {
    const newValue = !this._showAllProperties.value;
    localStorage.setItem(this._SHOW_ALL_PROPERTIES_KEY, JSON.stringify(newValue));
    this._showAllProperties.next(newValue);
  }

  toggleShowComments() {
    this.setShowComments(!this._showComments.value);
  }

  /** Take up the stored setting, which another instance (another view) may have changed since this one read it. */
  reloadShowComments() {
    const stored = localStorage.getItem(this._SHOW_ALL_COMMENTS_KEY) === 'true';
    if (stored !== this._showComments.value) {
      this._showComments.next(stored);
    }
  }

  setShowComments(show: boolean) {
    if (show === this._showComments.value) {
      return;
    }
    localStorage.setItem(this._SHOW_ALL_COMMENTS_KEY, JSON.stringify(show));
    this._showComments.next(show);
  }
}
