import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AuthService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { of } from 'rxjs';

import { LoginFormComponent } from './login-form.component';

const meta: Meta<LoginFormComponent> = {
  title: 'Shared / Header / Login Form',
  component: LoginFormComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: DspApiConnectionToken, useValue: {} as KnoraApiConnection },
        { provide: AuthService, useValue: { login: () => of(null) } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<LoginFormComponent>;

export const DefaultView: Story = {
  name: 'Shows username and password fields with login button',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Username input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="username-input"]')).not.toBeNull();
    });
    await step('Password input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="password-input"]')).not.toBeNull();
    });
    await step('Login submit button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="submit-button"]')).not.toBeNull();
    });
  },
};
