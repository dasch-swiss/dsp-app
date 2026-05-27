import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { PasswordConfirmFormComponent } from './password-confirm-form.component';

const meta: Meta<PasswordConfirmFormComponent> = {
  title: 'Shared / Header / Password Confirm Form',
  component: PasswordConfirmFormComponent,
};
export default meta;
type Story = StoryObj<PasswordConfirmFormComponent>;

export const DefaultView: Story = {
  name: 'Shows new password and confirm password fields',
  play: async ({ canvasElement, step }) => {
    await step('Two password input fields are rendered', async () => {
      const inputs = canvasElement.querySelectorAll('input[type="password"]');
      await expect(inputs.length).toBe(2);
    });
  },
};
