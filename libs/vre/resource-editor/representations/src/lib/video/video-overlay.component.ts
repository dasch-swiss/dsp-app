import { Component } from '@angular/core';
import { MediaPlayerService } from './media-player.service';

@Component({
  selector: 'app-video-overlay',
  template: ` <div style="display: flex">
    <mat-icon (click)="updateTimeFromButton(-10)">replay_10</mat-icon>
    <mat-icon (click)="videoPlayer.togglePlay()">{{ play ? 'pause' : 'play_arrow' }}</mat-icon>
    <mat-icon (click)="updateTimeFromButton(10)">forward_10</mat-icon>
  </div>`,
})
export class VideoOverlayComponent {
  // todo change following variables
  currentTime = 0;
  duration = 0;
  play = true;

  constructor(public videoPlayer: MediaPlayerService) {}

  updateTimeFromButton(range: number) {
    if (range > 0 && this.currentTime > this.duration - 10) {
      this.videoPlayer.navigate(this.duration);
    } else if (range < 0 && this.currentTime < 10) {
      this.videoPlayer.navigate(0);
    } else {
      this.videoPlayer.navigate(this.currentTime + range);
    }
  }
}
