import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { HEADER_BASE_PROVIDERS } from './header-stories.helper';
import { HeaderUserActionsComponent } from './header-user-actions.component';

const meta: Meta<HeaderUserActionsComponent> = {
  title: 'Shared / Header / Header User Actions',
  component: HeaderUserActionsComponent,
};
export default meta;
type Story = StoryObj<HeaderUserActionsComponent>;

export const LoggedOut: Story = {
  name: 'Shows help link and user menu when logged out',
  decorators: [
    applicationConfig({
      providers: [
        ...HEADER_BASE_PROVIDERS,
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Header user actions component is rendered', async () => {
      await expect(canvasElement.querySelector('app-header-user-actions')).not.toBeNull();
    });
    await step('Version badge is rendered', async () => {
      await expect(canvasElement.querySelector('app-version-badge')).not.toBeNull();
    });
  },
};
