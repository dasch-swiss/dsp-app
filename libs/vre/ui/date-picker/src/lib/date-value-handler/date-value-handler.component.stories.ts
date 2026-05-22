import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { DateValueHandlerComponent } from './date-value-handler.component';

const meta: Meta<DateValueHandlerComponent> = {
  title: 'UI / Date Picker / Date Value Handler',
  component: DateValueHandlerComponent,
  argTypes: {
    valueRequiredValidator: {
      description: 'When true, the date value is required.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Behavior' },
    },
    disabled: {
      description: 'When true, disables the entire handler.',
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
type Story = StoryObj<DateValueHandlerComponent>;

export const Empty: Story = {
  name: 'Shows empty date value handler with single date mode',
  args: {
    valueRequiredValidator: false,
    disabled: false,
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date value handler is rendered', async () => {
      await expect(canvasElement.querySelector('app-date-value-handler')).not.toBeNull();
    });
  },
};

export const Disabled: Story = {
  name: 'Shows disabled date value handler',
  args: {
    valueRequiredValidator: false,
    disabled: true,
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date value handler is rendered in disabled state', async () => {
      await expect(canvasElement.querySelector('app-date-value-handler')).not.toBeNull();
    });
  },
};
