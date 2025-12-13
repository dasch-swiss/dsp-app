import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AutoLoginService, LocalStorageWatcherService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { CookieBannerComponent } from './cookie-banner.component';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet />
    <app-cookie-banner />
  `,
  imports: [RouterOutlet, CookieBannerComponent],
})
export class AppComponent {
  constructor(
    private readonly _titleService: Title,
    private readonly _autoLoginService: AutoLoginService,
    private readonly _localStorageWatcher: LocalStorageWatcherService,
    private readonly _localizationService: LocalizationService
  ) {
    this._autoLoginService.setup();
    this._localStorageWatcher.watchAccessToken();
    this._titleService.setTitle('DaSCH Service Platform');
    this._localizationService.init();
  }
}
