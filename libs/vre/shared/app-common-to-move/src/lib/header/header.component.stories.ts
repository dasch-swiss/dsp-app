import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { of } from 'rxjs';

import { HEADER_BASE_PROVIDERS } from './header-stories.helper';
import { HeaderComponent } from './header.component';

const meta: Meta<HeaderComponent> = {
  title: 'Shared / Header / Header',
  component: HeaderComponent,
};
export default meta;
type Story = StoryObj<HeaderComponent>;

export const LoggedOut: Story = {
  name: 'Shows full header with search and login button when logged out',
  decorators: [
    applicationConfig({
      providers: [
        ...HEADER_BASE_PROVIDERS,
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Toolbar is rendered', async () => {
      await expect(canvasElement.querySelector('mat-toolbar')).not.toBeNull();
    });
    await step('Global search is rendered', async () => {
      await expect(canvasElement.querySelector('app-global-search')).not.toBeNull();
    });
  },
};

export const LoggedIn: Story = {
  name: 'Shows full header with user menu when logged in',
  decorators: [
    applicationConfig({
      providers: [
        ...HEADER_BASE_PROVIDERS,
        {
          provide: UserService,
          useValue: {
            isLoggedIn$: of(true),
            user$: of({ username: 'john.doe', givenName: 'John', familyName: 'Doe' }),
            isSysAdmin$: of(false),
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Header toolbar is rendered', async () => {
      await expect(canvasElement.querySelector('mat-toolbar')).not.toBeNull();
    });
    await step('User actions area is rendered', async () => {
      await expect(canvasElement.querySelector('app-header-user-actions')).not.toBeNull();
    });
  },
};
