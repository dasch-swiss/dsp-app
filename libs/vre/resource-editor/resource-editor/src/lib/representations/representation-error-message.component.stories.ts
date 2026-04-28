import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { RepresentationErrorMessageComponent } from './representation-error-message.component';

const meta: Meta<RepresentationErrorMessageComponent> = {
  title: 'Resource Editor / Resource / Error Message',
  component: RepresentationErrorMessageComponent,
};
export default meta;
type Story = StoryObj<RepresentationErrorMessageComponent>;

export const DefaultView: Story = {
  name: 'Shows resource-not-loaded error message',
  play: async ({ canvasElement, step }) => {
    await step('No-results component is rendered', async () => {
      const noResults = canvasElement.querySelector('app-no-results-found');
      await expect(noResults).not.toBeNull();
    });
  },
};
