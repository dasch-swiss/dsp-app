import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { DateRangeInputComponent } from './date-range-input.component';

const meta: Meta<DateRangeInputComponent> = {
  title: 'UI / Date Picker / Date Range Input',
  component: DateRangeInputComponent,
  argTypes: {
    label: {
      description: 'Label displayed above the date range fields.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' }, category: 'Content' },
    },
    startLabel: {
      description: 'Label for the start date field.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Start Date' }, category: 'Content' },
    },
    endLabel: {
      description: 'Label for the end date field.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'End Date' }, category: 'Content' },
    },
    placeholder: {
      description: 'Placeholder text for both date inputs.',
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'YYYY-MM-DD' }, category: 'Content' },
    },
    hint: {
      description: 'Helper text shown below the fields.',
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
      description: 'Marks both fields as required.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<DateRangeInputComponent>;

export const Empty: Story = {
  name: 'Shows two empty date fields for start and end',
  args: {
    label: 'Date Range',
    startLabel: 'Start Date',
    endLabel: 'End Date',
    placeholder: 'YYYY-MM-DD',
    appearance: 'fill',
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Start Date" label is visible', async () => {
      await expect(canvas.getByText('Start Date')).toBeInTheDocument();
    });
    await step('"End Date" label is visible', async () => {
      await expect(canvas.getByText('End Date')).toBeInTheDocument();
    });
  },
};

export const WithCustomLabels: Story = {
  name: 'Shows custom start and end labels',
  args: {
    label: 'Project Period',
    startLabel: 'Project Start',
    endLabel: 'Project End',
    placeholder: 'YYYY-MM-DD',
    appearance: 'outline',
    required: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Project Start" label is visible', async () => {
      await expect(canvas.getByText('Project Start')).toBeInTheDocument();
    });
    await step('"Project End" label is visible', async () => {
      await expect(canvas.getByText('Project End')).toBeInTheDocument();
    });
  },
};
