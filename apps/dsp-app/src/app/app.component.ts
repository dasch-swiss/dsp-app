import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GrafanaFaroService, PendoAnalyticsService } from '@dasch-swiss/vre/shared/app-analytics';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AutoLoginService, LocalStorageWatcherService } from '@dasch-swiss/vre/shared/app-session';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showCookieBanner = true;
  session = false;

  constructor(
    private _router: Router,
    private _titleService: Title,
    private _autoLoginService: AutoLoginService,
    private _pendo: PendoAnalyticsService,
    private _localStorageWatcher: LocalStorageWatcherService,
    private _grafana: GrafanaFaroService
  ) {
    this._grafana.setup();
    this._pendo.setup();
    this._autoLoginService.setup();
    this._localStorageWatcher.watchAccessToken();
    this._titleService.setTitle('DaSCH Service Platform');
  }

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
    this.showCookieBanner = !this.showCookieBanner;
    localStorage.setItem('cookieBanner', JSON.stringify(this.showCookieBanner));
  }
}
