import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';

@Component({
  selector: 'app-cookie-banner',
  template: ` @if (showCookieBanner) {
    <div class="cookie-banner">
      <p class="note">
        This web-application uses cookies to provide you with a greater user experience. By using the application you
        accept our
        <span class="link" (click)="goToCookiePolicy()">use of cookies</span>.
      </p>
      <div class="action">
        <button mat-flat-button color="primary" (click)="closeCookieBanner()" data-cy="accept-cookies">ACCEPT</button>
      </div>
    </div>
  }`,
  styleUrls: [`./cookie-banner.component.scss`],
})
export class CookieBannerComponent implements OnInit {
  showCookieBanner = true;

  constructor(private _router: Router) {}

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
