import { Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

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
