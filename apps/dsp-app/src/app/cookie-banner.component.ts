import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cookie-banner',
  template: ` @if (showCookieBanner) {
    <div class="cookie-banner">
      <p class="note">
        {{ 'app.cookieBanner.message' | translate }}
        <span class="link" (click)="goToCookiePolicy()">{{ 'app.cookieBanner.useOfCookies' | translate }}</span
        >.
      </p>
      <div class="action">
        <button mat-flat-button color="primary" (click)="closeCookieBanner()" data-cy="accept-cookies">
          {{ 'app.cookieBanner.accept' | translate }}
        </button>
      </div>
    </div>
  }`,
  styleUrls: [`./cookie-banner.component.scss`],
  imports: [MatButtonModule, TranslateModule],
})
export class CookieBannerComponent implements OnInit {
  showCookieBanner = true;

  constructor(private readonly _router: Router) {}

  ngOnInit() {
    if (localStorage.getItem('cookieBanner') === null) {
      localStorage.setItem('cookieBanner', JSON.stringify(this.showCookieBanner));
    } else {
      this.showCookieBanner = JSON.parse(localStorage.getItem('cookieBanner'));
    }
  }

  goToCookiePolicy() {
    this._router.navigate([RouteConstants.cookiePolicy]);
  }

  closeCookieBanner() {
    this.showCookieBanner = false;
    localStorage.setItem('cookieBanner', JSON.stringify(this.showCookieBanner));
  }
}
