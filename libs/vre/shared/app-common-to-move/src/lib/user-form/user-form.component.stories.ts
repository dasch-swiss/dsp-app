import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { UserFormComponent } from './user-form.component';

const meta: Meta<UserFormComponent> = {
  title: 'Shared / User Form / User Form',
  component: UserFormComponent,
  argTypes: {
    data: {
      description: 'Initial user data to pre-populate the form.',
      table: { type: { summary: '{ givenName, familyName, email, username, lang }' }, category: 'State' },
    },
    showLanguage: {
      description:
        'Whether to render the language picker. Default true. Self-edit flows pass false so the header LanguageSwitcherComponent is the canonical entry point.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<UserFormComponent>;

export const EmptyForm: Story = {
  name: 'Shows empty user form ready for new user creation',
  args: {
    data: {
      givenName: '',
      familyName: '',
      email: '',
      username: '',
      lang: 'en',
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Form inputs are rendered', async () => {
      await expect(canvasElement.querySelectorAll('input').length).toBeGreaterThan(0);
    });
  },
};

export const PrefilledForm: Story = {
  name: 'Shows pre-filled user form for editing',
  args: {
    data: {
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john.doe',
      lang: 'en',
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"John" given name is pre-filled', async () => {
      await expect(canvas.getByDisplayValue('John')).toBeInTheDocument();
    });
    await step('"Doe" family name is pre-filled', async () => {
      await expect(canvas.getByDisplayValue('Doe')).toBeInTheDocument();
    });
    await step('Language picker is shown by default', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const HidesLanguagePickerWhenShowLanguageIsFalse: Story = {
  name: 'Hides language picker when showLanguage is false (self-edit)',
  args: {
    data: {
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john.doe',
      lang: 'en',
    },
    showLanguage: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Language mat-select is not rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).toBeNull();
    });
  },
};
