import { Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageWatcherService {
  watchAccessToken() {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        takeUntilDestroyed(),
        filter(event => {
          return event.key === 'ACCESS_TOKEN' && event.oldValue !== event.newValue;
        })
      )
      .subscribe(() => {
        window.location.reload();
      });
  }
}
