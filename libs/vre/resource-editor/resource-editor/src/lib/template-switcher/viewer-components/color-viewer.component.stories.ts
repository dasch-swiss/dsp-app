import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ColorViewerComponent } from './color-viewer.component';

const meta: Meta<ColorViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Template Switcher / Color Viewer',
  component: ColorViewerComponent,
  argTypes: {
    value: {
      description: 'ReadColorValue containing the hex color string.',
      table: { type: { summary: 'ReadColorValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ColorViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows a colored box for the given hex color',
  args: {
    value: { color: '#3399ff' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Color box is rendered', async () => {
      const box = canvasElement.querySelector('[data-cy="color-box"]');
      await expect(box).not.toBeNull();
    });
    await step('Color box has the correct background color', async () => {
      const box = canvasElement.querySelector('[data-cy="color-box"]') as HTMLElement;
      await expect(box.style.backgroundColor).not.toBe('');
    });
  },
};

export const RedColor: Story = {
  name: 'Shows red color box',
  args: {
    value: { color: '#ff0000' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Color box is rendered with red background', async () => {
      const box = canvasElement.querySelector('[data-cy="color-box"]');
      await expect(box).not.toBeNull();
    });
  },
};
