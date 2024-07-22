import { Subject } from 'rxjs';

export class BaseService {
  isDestroyed$ = new Subject<void>();

  destroy() {
    this.isDestroyed$.next();
    this.isDestroyed$.complete();
  }
}
