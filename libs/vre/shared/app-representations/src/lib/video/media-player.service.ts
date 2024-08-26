import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MediaPlayerService {
  private _mediaPlayer!: HTMLVideoElement | HTMLAudioElement;

  onTimeUpdate$!: Observable<number>;

  onInit(player: HTMLVideoElement | HTMLAudioElement) {
    this._mediaPlayer = player;
    this.onTimeUpdate$ = fromEvent<{
      target: HTMLVideoElement | HTMLAudioElement;
    }>(this._mediaPlayer, 'timeupdate').pipe(map(v => v.target.currentTime));
  }

  togglePlay() {
    if (this.isPaused()) {
      this.play();
    } else {
      this.pause();
    }
  }

  isPaused() {
    return this._mediaPlayer.paused;
  }

  play() {
    this._mediaPlayer.play();
  }

  pause() {
    this._mediaPlayer.pause();
  }

  duration() {
    return Math.floor(this._mediaPlayer.duration);
  }

  playFromBeginning() {
    this.navigate(0);
  }

  toggleMute() {
    this._mediaPlayer.muted = !this._mediaPlayer.muted;
  }

  isMuted() {
    return this._mediaPlayer.muted;
  }

  navigate(position: number) {
    this._mediaPlayer.currentTime = position;
  }

  currentTime() {
    return this._mediaPlayer.currentTime;
  }
}
