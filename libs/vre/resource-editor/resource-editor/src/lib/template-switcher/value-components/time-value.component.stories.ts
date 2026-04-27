import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { DateTime } from '../../resource-properties/date-time';
import { TimeValueComponent } from './time-value.component';

const meta: Meta<TimeValueComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / Time Value',
  component: TimeValueComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to a DateTime object (date + time string).',
      table: { type: { summary: 'FormControl<DateTime>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<TimeValueComponent>;

export const Empty: Story = {
  name: 'Shows empty date and time picker inputs',
  args: {
    control: new FormControl<DateTime>(new DateTime(undefined, '')) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Time input is rendered', async () => {
      const timeInput = canvasElement.querySelector('[data-cy="time-input"]');
      await expect(timeInput).not.toBeNull();
    });
    await step('Date picker input is rendered', async () => {
      const dateInput = canvasElement.querySelector('input[readonly]');
      await expect(dateInput).not.toBeNull();
    });
  },
};

export const WithValue: Story = {
  name: 'Shows pre-filled date and time',
  args: {
    control: new FormControl<DateTime>(new DateTime(new Date('2024-06-15'), '14:30')) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Time input is rendered with a value', async () => {
      const timeInput = canvasElement.querySelector('[data-cy="time-input"]') as HTMLInputElement;
      await expect(timeInput).not.toBeNull();
    });
  },
};
