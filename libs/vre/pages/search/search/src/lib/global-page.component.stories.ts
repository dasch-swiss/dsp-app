import { provideRouter } from '@angular/router';
import { KnoraApiConfig, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService, AppConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { GlobalPageComponent } from './global-page.component';

// Mirrors the header's own story setup (app-common-to-move `header-stories.helper.ts`, not exported).
const meta: Meta<GlobalPageComponent> = {
  title: 'Search / Global Page',
  component: GlobalPageComponent,
  argTypes: {},
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: AppConfigToken, useValue: { dspRelease: '0.0.0', featureFlags: { allowEraseProjects: false } } },
        { provide: DspApiConnectionToken, useValue: {} as KnoraApiConnection },
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: false, environment: 'dev', release: '0.0.0', color: 'accent' },
            dspApiConfig: new KnoraApiConfig('https', 'api.example.com'),
          },
        },
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<GlobalPageComponent>;

export const ShowsHeaderAboveRoutedContent: Story = {
  name: 'Shows the app header with the global search above the routed page',
  play: async ({ canvasElement, step }) => {
    await step('Header toolbar with global search is rendered', async () => {
      await expect(canvasElement.querySelector('mat-toolbar')).not.toBeNull();
      await expect(canvasElement.querySelector('app-global-search')).not.toBeNull();
    });
    await step('A router outlet follows for the page content', async () => {
      await expect(canvasElement.querySelector('router-outlet')).not.toBeNull();
    });
    await step('Login is offered to a logged-out visitor', async () => {
      await expect(await within(canvasElement).findByRole('button', { name: /log ?in/i })).toBeInTheDocument();
    });
  },
};
