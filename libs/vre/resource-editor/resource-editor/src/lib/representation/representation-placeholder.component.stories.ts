import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { RepresentationPlaceholderComponent } from './representation-placeholder.component';

const meta: Meta<RepresentationPlaceholderComponent> = {
  title: 'Resource Editor / 3. Representation / Placeholder',
  component: RepresentationPlaceholderComponent,
};
export default meta;
type Story = StoryObj<RepresentationPlaceholderComponent>;

export const ShowsPlaceholderMessageWhenAssetNotYetAvailable: Story = {
  name: 'Shows placeholder message when asset not yet available',
  play: async ({ canvasElement, step }) => {
    await step('Centered placeholder message is rendered', async () => {
      const message = canvasElement.querySelector('app-centered-message');
      await expect(message).not.toBeNull();
    });
  },
};
