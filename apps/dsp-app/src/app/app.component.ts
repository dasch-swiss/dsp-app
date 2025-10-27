import { Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PendoAnalyticsService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { AutoLoginService, LocalStorageWatcherService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet />
    <app-cookie-banner />
  `,
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly _translateService = inject(TranslateService);

  constructor(
    private _titleService: Title,
    private _autoLoginService: AutoLoginService,
    private _pendo: PendoAnalyticsService,
    private _localStorageWatcher: LocalStorageWatcherService,
    private _localizationService: LocalizationService
  ) {
    this._pendo.setup();
    this._autoLoginService.setup();
    this._localStorageWatcher.watchAccessToken();
    this._titleService.setTitle('DaSCH Service Platform');
  }

  ngOnInit() {
    this._localizationService.init();
  }
}
