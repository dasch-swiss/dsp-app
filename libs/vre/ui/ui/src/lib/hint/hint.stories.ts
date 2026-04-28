import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { HintComponent } from './hint.component';

const meta: Meta<HintComponent> = {
  title: 'UI / Hint / Search Hint',
  component: HintComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<HintComponent>;

export const Default: Story = {
  name: 'Renders search syntax hint with read-more link',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Read more link is visible', async () => {
      await expect(canvas.getByRole('link')).toBeInTheDocument();
    });
  },
};
