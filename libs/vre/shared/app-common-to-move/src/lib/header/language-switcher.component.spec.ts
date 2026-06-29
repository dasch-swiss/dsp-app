import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent.selectLanguage', () => {
  const mockUser = { id: 'http://rdfh.ch/users/1', familyName: 'Doe', givenName: 'Jane', lang: 'en' } as any;

  let component: LanguageSwitcherComponent;
  let localization: { currentLanguage: string };
  let userService: { currentUser: typeof mockUser | null };
  let userApi: { updateBasicInformation: jest.Mock };
  let notification: { openSnackBar: jest.Mock };
  let translateService: { onLangChange: Subject<unknown>; instant: jest.Mock };

  beforeEach(() => {
    localization = { currentLanguage: 'en' };
    userService = { currentUser: { ...mockUser } };
    userApi = { updateBasicInformation: jest.fn().mockReturnValue(of({})) };
    notification = { openSnackBar: jest.fn() };
    translateService = { onLangChange: new Subject(), instant: jest.fn().mockReturnValue('localized snackbar') };

    component = new LanguageSwitcherComponent(
      localization as LocalizationService,
      userService as unknown as UserService,
      userApi as unknown as UserApiService,
      notification as unknown as NotificationService,
      translateService as unknown as TranslateService
    );
  });

  it('persists the new language via updateBasicInformation for logged-in users', () => {
    component.selectLanguage('de');

    expect(userApi.updateBasicInformation).toHaveBeenCalledWith(mockUser.id, {
      familyName: mockUser.familyName,
      givenName: mockUser.givenName,
      lang: 'de',
    });
  });

  it('syncs UserService.currentUser.lang in memory on successful persist', () => {
    component.selectLanguage('fr');

    expect(userService.currentUser!.lang).toBe('fr');
  });

  it('does not call the API for anonymous users', () => {
    userService.currentUser = null;

    component.selectLanguage('it');

    expect(userApi.updateBasicInformation).not.toHaveBeenCalled();
  });

  it('does not mutate user.lang when the persist call fails', () => {
    userApi.updateBasicInformation.mockReturnValueOnce(throwError(() => new Error('network')));
    const before = userService.currentUser!.lang;

    expect(() => component.selectLanguage('rm')).not.toThrow();

    expect(userService.currentUser!.lang).toBe(before);
  });
});
