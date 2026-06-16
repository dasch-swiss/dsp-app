import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { BehaviorSubject, of } from 'rxjs';
import { expect, within } from 'storybook/test';

import { HEADER_BASE_PROVIDERS } from './header-stories.helper';
import { LanguageSwitcherComponent } from './language-switcher.component';

const localizationServiceStub = (initial: AvailableLanguage) => {
  const subject = new BehaviorSubject<AvailableLanguage>(initial);
  return {
    get currentLanguage(): AvailableLanguage {
      return subject.getValue();
    },
    set currentLanguage(value: AvailableLanguage) {
      subject.next(value);
    },
    currentLanguage$: subject.asObservable(),
  };
};

const LANGUAGE_SWITCHER_PROVIDERS = (initial: AvailableLanguage) => [
  ...HEADER_BASE_PROVIDERS,
  { provide: LocalizationService, useValue: localizationServiceStub(initial) },
  { provide: UserService, useValue: { currentUser: null, isLoggedIn$: of(false), user$: of(null) } },
  { provide: UserApiService, useValue: { updateBasicInformation: () => of({}) } },
  { provide: NotificationService, useValue: { openSnackBar: () => undefined } },
];

const meta: Meta<LanguageSwitcherComponent> = {
  title: 'Shared / Header / Language Switcher',
  component: LanguageSwitcherComponent,
};
export default meta;
type Story = StoryObj<LanguageSwitcherComponent>;

export const EnglishSelected: Story = {
  name: 'Shows language icon and uppercase code when English is selected',
  decorators: [applicationConfig({ providers: LANGUAGE_SWITCHER_PROVIDERS('en') })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger button is rendered', async () => {
      await expect(canvas.getByRole('button')).toBeInTheDocument();
    });
    await step('Language icon is visible', async () => {
      await expect(canvasElement.querySelector('mat-icon')?.textContent?.trim()).toBe('language');
    });
    await step('Current language code is shown in uppercase', async () => {
      await expect(canvas.getByText('EN')).toBeInTheDocument();
    });
  },
};

export const GermanSelected: Story = {
  name: 'Shows DE when German is selected',
  decorators: [applicationConfig({ providers: LANGUAGE_SWITCHER_PROVIDERS('de') })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Current language code DE is shown', async () => {
      await expect(canvas.getByText('DE')).toBeInTheDocument();
    });
  },
};

export const FrenchSelected: Story = {
  name: 'Shows FR when French is selected',
  decorators: [applicationConfig({ providers: LANGUAGE_SWITCHER_PROVIDERS('fr') })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Current language code FR is shown', async () => {
      await expect(canvas.getByText('FR')).toBeInTheDocument();
    });
  },
};
