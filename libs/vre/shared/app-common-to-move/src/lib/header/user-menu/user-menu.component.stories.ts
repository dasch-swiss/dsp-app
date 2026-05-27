import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { HEADER_BASE_PROVIDERS } from '../header-stories.helper';
import { UserMenuComponent } from './user-menu.component';

const meta: Meta<UserMenuComponent> = {
  title: 'Shared / Header / User Menu',
  component: UserMenuComponent,
};
export default meta;
type Story = StoryObj<UserMenuComponent>;

export const LoggedOut: Story = {
  name: 'Shows login icon when user is not logged in',
  decorators: [
    applicationConfig({
      providers: [
        ...HEADER_BASE_PROVIDERS,
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('User menu component is rendered', async () => {
      await expect(canvasElement.querySelector('app-user-menu')).not.toBeNull();
    });
  },
};

export const LoggedIn: Story = {
  name: 'Shows user avatar when user is logged in',
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
    await step('User menu component is rendered', async () => {
      await expect(canvasElement.querySelector('app-user-menu')).not.toBeNull();
    });
  },
};
