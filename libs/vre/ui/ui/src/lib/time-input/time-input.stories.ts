import { FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';

import { TimeInputComponent } from './time-input.component';

const meta: Meta<TimeInputComponent> = {
  title: 'UI / Time Input / Time Field',
  component: TimeInputComponent,
  argTypes: {
    label: {
      description: 'Label shown inside the mat-form-field.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    control: {
      description: 'FormControl holding the time value as a number (seconds) or null.',
      table: { type: { summary: 'FormControl<number | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<TimeInputComponent>;

export const Empty: Story = {
  name: 'Shows empty time field ready for input',
  args: {
    label: 'Start time',
    control: new FormControl<number | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Start time" label is visible', async () => {
      await expect(canvas.getByText('Start time')).toBeInTheDocument();
    });
    await step('Input field is rendered', async () => {
      await expect(canvasElement.querySelector('input')).not.toBeNull();
    });
  },
};

export const AcceptsTimeInput: Story = {
  name: 'Accepts typed time value in HH:MM:SS format',
  args: {
    label: 'End time',
    control: new FormControl<number | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input')!;
    await step('User types "01:30:00"', async () => {
      await userEvent.click(input);
      await userEvent.type(input, '01:30:00');
    });
    await step('Input displays the typed value', async () => {
      await expect(input.value).toBeTruthy();
    });
  },
};
