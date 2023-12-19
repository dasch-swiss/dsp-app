import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';

// empty component used as a redirect when the user logs in
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class AuthGuardComponent {
  constructor(private router: Router) {
    this.router.navigate([RouteConstants.home], { replaceUrl: true });
  }
}
