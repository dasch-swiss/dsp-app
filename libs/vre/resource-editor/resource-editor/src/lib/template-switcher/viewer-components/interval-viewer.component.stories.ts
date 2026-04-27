import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { IntervalViewerComponent } from './interval-viewer.component';

const meta: Meta<IntervalViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Template Switcher / Interval Viewer',
  component: IntervalViewerComponent,
  argTypes: {
    value: {
      description: 'ReadIntervalValue containing start and end seconds.',
      table: { type: { summary: 'ReadIntervalValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IntervalViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows formatted start and end time of an interval',
  args: {
    value: { start: 65, end: 130 } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Interval text is rendered', async () => {
      const canvas = within(canvasElement);
      const text = canvasElement.textContent ?? '';
      await expect(text).toContain('1:05');
      await expect(text).toContain('2:10');
    });
  },
};
