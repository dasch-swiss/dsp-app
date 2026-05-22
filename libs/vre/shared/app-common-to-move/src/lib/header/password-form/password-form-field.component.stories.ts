import { FormControl, Validators } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { PasswordFormFieldComponent } from './password-form-field.component';

const meta: Meta<PasswordFormFieldComponent> = {
  title: 'Shared / Header / Password Form Field',
  component: PasswordFormFieldComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to the password input.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    placeholder: {
      description: 'Label displayed inside the field.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    showToggleVisibility: {
      description: 'When true, shows an eye icon to toggle password visibility.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<PasswordFormFieldComponent>;

export const Default: Story = {
  name: 'Shows password field with masked input',
  args: {
    control: new FormControl<string | null>(''),
    placeholder: 'Password',
    showToggleVisibility: false,
    validatorErrors: null,
  },
  play: async ({ canvasElement, step }) => {
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    await step('Input type is "password" by default', async () => {
      await expect(input?.type).toBe('password');
    });
  },
};

export const WithVisibilityToggle: Story = {
  name: 'Shows toggle button to reveal password',
  args: {
    control: new FormControl<string | null>(''),
    placeholder: 'Password',
    showToggleVisibility: true,
    validatorErrors: null,
  },
  play: async ({ canvasElement, step }) => {
    await step('Visibility toggle button is present', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
  },
};

export const WithValidationError: Story = {
  name: 'Shows validation error when field is invalid and touched',
  args: {
    control: (() => {
      const c = new FormControl<string | null>('', Validators.required);
      c.markAsTouched();
      c.updateValueAndValidity();
      return c;
    })(),
    placeholder: 'Password',
    showToggleVisibility: false,
    validatorErrors: [{ errorKey: 'required', message: 'Password is required' }],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Password is required" error is visible', async () => {
      await expect(canvas.getByText('Password is required')).toBeInTheDocument();
    });
  },
};
