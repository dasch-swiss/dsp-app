import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { AppDatePickerComponent } from './app-date-picker.component';

const meta: Meta<AppDatePickerComponent> = {
  title: 'UI / Date Picker / App Date Picker',
  component: AppDatePickerComponent,
  argTypes: {
    calendar: {
      description: 'Calendar system to use for date display.',
      control: 'select',
      options: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
      table: { type: { summary: 'string' }, defaultValue: { summary: 'GREGORIAN' }, category: 'Behavior' },
    },
    disableCalendarSelector: {
      description: 'When true, hides the calendar system selector (used for end date of a period).',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    disabled: {
      description: 'When true, disables the entire picker.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    required: {
      description: 'Marks the field as required.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    placeholder: {
      description: 'Placeholder text shown in the input.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<AppDatePickerComponent>;

export const Empty: Story = {
  name: 'Shows empty Gregorian date picker',
  args: {
    calendar: 'GREGORIAN',
    disabled: false,
    required: false,
    disableCalendarSelector: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date picker component is rendered', async () => {
      await expect(canvasElement.querySelector('app-date-picker')).not.toBeNull();
    });
  },
};

export const Disabled: Story = {
  name: 'Shows disabled date picker',
  args: {
    calendar: 'GREGORIAN',
    disabled: true,
    required: false,
    disableCalendarSelector: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date picker is in disabled state', async () => {
      await expect(canvasElement.querySelector('app-date-picker')).not.toBeNull();
    });
  },
};

export const WithCalendarSelectorDisabled: Story = {
  name: 'Hides calendar selector when used as end date of a period',
  args: {
    calendar: 'GREGORIAN',
    disabled: false,
    required: false,
    disableCalendarSelector: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date picker is rendered without calendar selector', async () => {
      await expect(canvasElement.querySelector('app-date-picker')).not.toBeNull();
    });
  },
};
