import { createDate } from '@dasch-swiss/vre/shared/calendar';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { DateInputComponent } from './date-input.component';

const meta: Meta<DateInputComponent> = {
  title: 'UI / Date Picker / Date Input',
  component: DateInputComponent,
  argTypes: {
    label: {
      description: 'Label shown inside the form field.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' }, category: 'Content' },
    },
    placeholder: {
      description: 'Placeholder text shown in the input.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'YYYY-MM-DD' }, category: 'Content' },
    },
    hint: {
      description: 'Helper text shown below the field.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    appearance: {
      description: 'Material form field appearance style.',
      control: 'select',
      options: ['fill', 'outline'],
      table: { type: { summary: "'fill' | 'outline'" }, defaultValue: { summary: 'fill' }, category: 'Appearance' },
    },
    required: {
      description: 'Marks the field as required.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<DateInputComponent>;

export const Empty: Story = {
  name: 'Shows empty date input with calendar button',
  args: {
    label: 'Date',
    placeholder: 'YYYY-MM-DD',
    appearance: 'fill',
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Calendar icon button is rendered', async () => {
      const btn = canvasElement.querySelector('[aria-label="Open calendar"]');
      await expect(btn).not.toBeNull();
    });
  },
};

export const WithOutlineAppearance: Story = {
  name: 'Shows date input with outline appearance',
  args: {
    label: 'Date',
    placeholder: 'YYYY-MM-DD',
    appearance: 'outline',
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Form field uses outline appearance', async () => {
      const field = canvasElement.querySelector('mat-form-field');
      await expect(field?.classList.contains('mat-form-field-appearance-outline')).toBe(true);
    });
  },
};

export const WithHint: Story = {
  name: 'Shows hint text below the field',
  args: {
    label: 'Start Date',
    placeholder: 'YYYY-MM-DD',
    hint: 'Format: YYYY-MM-DD',
    appearance: 'fill',
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Format: YYYY-MM-DD" hint is visible', async () => {
      await expect(canvas.getByText('Format: YYYY-MM-DD')).toBeInTheDocument();
    });
  },
};
