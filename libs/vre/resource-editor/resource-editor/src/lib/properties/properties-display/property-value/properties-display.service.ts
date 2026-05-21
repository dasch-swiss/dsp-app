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
    const newValue = !this._showComments.value;
    localStorage.setItem(this._SHOW_ALL_COMMENTS_KEY, JSON.stringify(newValue));
    this._showComments.next(newValue);
  }
}
