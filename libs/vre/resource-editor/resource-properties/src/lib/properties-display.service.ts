import { BehaviorSubject } from 'rxjs';

export class PropertiesDisplayService {
  private _showAllProperties = new BehaviorSubject(false);
  showAllProperties$ = this._showAllProperties.asObservable();

  private _showComments = new BehaviorSubject(false);
  showComments$ = this._showComments.asObservable();

  toggleShowProperties() {
    this._showAllProperties.next(!this._showAllProperties.value);
  }

  toggleShowComments() {
    this._showComments.next(!this._showComments.value);
  }
}
