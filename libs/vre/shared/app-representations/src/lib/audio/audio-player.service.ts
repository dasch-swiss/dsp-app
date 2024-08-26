import { Injectable } from '@angular/core';

@Injectable()
export class AudioPlayerService {
  private _audioPlayer!: HTMLAudioElement;

  onInit(player: HTMLAudioElement) {
    this._audioPlayer = player;
  }

  togglePlay() {
    if (this.isPaused()) {
      this.play();
    } else {
      this.pause();
    }
  }

  isPaused() {
    return this._audioPlayer.paused;
  }

  play() {
    this._audioPlayer.play();
  }

  pause() {
    this._audioPlayer.pause();
  }

  duration() {
    return this._audioPlayer.duration;
  }

  playFromBeginning() {
    this.navigate(0);
  }

  toggleMute() {
    this._audioPlayer.muted = !this._audioPlayer.muted;
  }

  isMuted() {
    return this._audioPlayer.muted;
  }

  navigate(position: number) {
    this._audioPlayer.currentTime = position;
  }

  currentTime() {
    return this._audioPlayer.currentTime;
  }
}
