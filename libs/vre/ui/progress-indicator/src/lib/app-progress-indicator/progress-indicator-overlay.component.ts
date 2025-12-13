import { Component } from '@angular/core';
import { AppProgressIndicatorComponent } from './app-progress-indicator.component';

@Component({
  selector: 'app-progress-indicator-overlay',
  imports: [AppProgressIndicatorComponent],

  template: ` <div
    style="position: fixed; top: 0; left: 0; z-index: 3; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.7); display: flex; justify-content: center; align-items: center;">
    <app-progress-indicator />
  </div>`,
})
export class ProgressIndicatorOverlayComponent {}
