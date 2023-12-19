import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private _subject = new Subject<any>();

  setLanguage(lang: string) {
    this._subject.next({ var: lang });
  }
  getLanguage(): Observable<any> {
    return this._subject.asObservable();
  }
}
