import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PendoAnalyticsService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { AutoLoginService, LocalStorageWatcherService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
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
