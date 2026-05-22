import { provideRouter } from '@angular/router';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AuthService, UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { of } from 'rxjs';

import { HeaderUserActionsComponent } from './header-user-actions.component';

const meta: Meta<HeaderUserActionsComponent> = {
  title: 'Shared / Header / Header User Actions',
  component: HeaderUserActionsComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: () => {} } },
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: false, environment: 'dev', release: 'v30.1.0', color: 'warn' },
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<HeaderUserActionsComponent>;

export const LoggedOut: Story = {
  name: 'Shows help link and user menu when logged out',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: () => {} } },
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: false, environment: 'dev', release: 'v30.1.0', color: 'warn' },
          },
        },
        {
          provide: UserService,
          useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) },
        },
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
