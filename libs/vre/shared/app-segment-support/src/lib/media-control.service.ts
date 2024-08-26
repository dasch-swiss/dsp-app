import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class MediaControlService {
  private _playSubject = new Subject<number>();
  play$ = this._playSubject.asObservable();

  private _watchForPauseSubject = new Subject<number>();
  watchForPause$ = this._watchForPauseSubject.asObservable();

  mediaDurationSecs?: number;

  playMedia(start: number, end: number) {
    this._playSubject.next(start);
    this._watchForPauseSubject.next(end);
  }
}
