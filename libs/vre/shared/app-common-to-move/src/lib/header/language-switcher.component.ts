import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AvailableLanguage, AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MatTooltipModule, TranslatePipe],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="langMenu"
      [attr.aria-label]="'ui.header.changeLanguage' | translate"
      [matTooltip]="'ui.header.changeLanguage' | translate">
      <mat-icon>translate</mat-icon>
    </button>
    <mat-menu #langMenu="matMenu" xPosition="before">
      @for (lang of availableLanguages; track lang.language) {
        <button mat-menu-item (click)="selectLanguage(lang.language)">
          @if (lang.language === currentLanguage) {
            <mat-icon>check</mat-icon>
          } @else {
            <mat-icon style="visibility: hidden">check</mat-icon>
          }
          <span>{{ lang.value }}</span>
        </button>
      }
    </mat-menu>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly availableLanguages = AvailableLanguages;

  get currentLanguage(): AvailableLanguage {
    return this._localizationService.currentLanguage;
  }

  constructor(
    private readonly _localizationService: LocalizationService,
    private readonly _userService: UserService,
    private readonly _userApiService: UserApiService,
    private readonly _notification: NotificationService,
    private readonly _translateService: TranslateService
  ) {}

  selectLanguage(language: AvailableLanguage): void {
    // The LocalizationService setter persists to localStorage and calls
    // TranslateService.use, so the UI updates and the choice survives reloads
    // for anonymous users with no further work.
    this._localizationService.currentLanguage = language;

    // For logged-in users, additionally persist to the user's profile so the
    // preference follows them across devices — same call the profile editor uses.
    const user = this._userService.currentUser;
    if (!user) return;

    this._userApiService
      .updateBasicInformation(user.id, {
        familyName: user.familyName,
        givenName: user.givenName,
        lang: language,
      })
      .subscribe(() => {
        this._notification.openSnackBar(
          this._translateService.instant('pages.userSettings.userForm.updateSuccess')
        );
      });
  }
}
