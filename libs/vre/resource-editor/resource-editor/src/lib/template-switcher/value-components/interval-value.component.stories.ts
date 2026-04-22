import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { IntervalValueComponent } from './interval-value.component';

const meta: Meta<IntervalValueComponent> = {
  title: 'Devs / Resource Editor / Template Switcher / Interval Value',
  component: IntervalValueComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to the interval start/end object.',
      table: { type: { summary: 'FormControl<{ start: number; end: number } | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IntervalValueComponent>;

export const DefaultView: Story = {
  name: 'Shows start and end time inputs for an interval',
  args: {
    control: new FormControl<{ start: number; end: number } | null>({ start: 10, end: 60 }),
  },
  play: async ({ canvasElement, step }) => {
    await step('Start time input is rendered', async () => {
      const startInput = canvasElement.querySelector('[data-cy="start-input"]');
      await expect(startInput).not.toBeNull();
    });
    await step('End time input is rendered', async () => {
      const endInput = canvasElement.querySelector('[data-cy="end-input"]');
      await expect(endInput).not.toBeNull();
    });
  },
};
