import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { TimeViewerComponent } from './time-viewer.component';

const meta: Meta<TimeViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Template Switcher / Time Viewer',
  component: TimeViewerComponent,
  argTypes: {
    value: {
      description: 'ReadTimeValue containing an ISO 8601 timestamp.',
      table: { type: { summary: 'ReadTimeValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<TimeViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows date and time from a timestamp',
  args: {
    value: { time: '2024-06-15T14:30:00Z' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Date span is rendered', async () => {
      const dateSpan = canvasElement.querySelector('[data-cy="time-switch-date"]');
      await expect(dateSpan).not.toBeNull();
    });
    await step('Time span is rendered', async () => {
      const timeSpan = canvasElement.querySelector('[data-cy="time-switch-time"]');
      await expect(timeSpan).not.toBeNull();
    });
    await step('Date content is not empty', async () => {
      const dateSpan = canvasElement.querySelector('[data-cy="time-switch-date"]');
      await expect(dateSpan?.textContent?.trim()).not.toBe('');
    });
  },
};
