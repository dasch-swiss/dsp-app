import { BehaviorSubject, Observable } from 'rxjs';

export class PropertiesDisplayService {
  readonly SHOW_ALL_PROPERTIES_KEY = 'SHOW_ALL_PROPERTIES';
  private _showAllProperties!: BehaviorSubject<boolean>;
  showAllProperties$!: Observable<boolean>;

  private _showComments = new BehaviorSubject(false);
  showComments$ = this._showComments.asObservable();

  constructor() {
    const cachedValue = localStorage.getItem(this.SHOW_ALL_PROPERTIES_KEY) === 'true';
    this._showAllProperties = new BehaviorSubject(cachedValue);
    this.showAllProperties$ = this._showAllProperties.asObservable();
  }

  toggleShowProperties() {
    const newValue = !this._showAllProperties.value;
    localStorage.setItem(this.SHOW_ALL_PROPERTIES_KEY, JSON.stringify(newValue));
    this._showAllProperties.next(newValue);
  }

  toggleShowComments() {
    this._showComments.next(!this._showComments.value);
  }
}
