import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class OntologyPageService {
  private _expandClassesSubject = new BehaviorSubject(true);
  expandClasses$ = this._expandClassesSubject.asObservable();

  toggleExpandClasses() {
    this._expandClassesSubject.next(!this._expandClassesSubject.value);
  }
}
