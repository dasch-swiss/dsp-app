import { Injectable, NgZone } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class IntervalWrapperService {
  constructor(
    private ngZone: NgZone,
    private platform: PlatformService
  ) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  public setInterval(action: Function, interval: number): number | undefined {
    // due to https://github.com/angular/angular/issues/20970
    // because of setInterval service worker is not starting on home page

    if (!this.platform.isBrowser) {
      return 0;
    }

    let intervalId;
    this.ngZone.runOutsideAngular(() => {
      intervalId = setInterval(() => {
        this.ngZone.run(() => {
          action();
        });
      }, interval);
    });

    return intervalId;
  }
}
