import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { SearchTipsComponent } from './search-tips.component';

const meta: Meta<SearchTipsComponent> = {
  title: 'Shared / Header / Search Tips',
  component: SearchTipsComponent,
};
export default meta;
type Story = StoryObj<SearchTipsComponent>;

export const DefaultView: Story = {
  name: 'Shows search tips panel with bullet points',
  play: async ({ canvasElement, step }) => {
    await step('Search tips container is rendered', async () => {
      await expect(canvasElement.querySelector('div')).not.toBeNull();
    });
    await step('Bullet list with tips is present', async () => {
      await expect(canvasElement.querySelector('ul')).not.toBeNull();
    });
  },
};
