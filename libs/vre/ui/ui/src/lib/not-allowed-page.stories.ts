import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { NotAllowedPageComponent } from './not-allowed-page.component';

const meta: Meta<NotAllowedPageComponent> = {
  title: 'UI / Not Allowed Page / Full Page',
  component: NotAllowedPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<NotAllowedPageComponent>;

export const Default: Story = {
  name: 'Renders full-page access-denied state with block icon',
  play: async ({ canvasElement, step }) => {
    await step('Block icon is rendered', async () => {
      await expect(canvasElement.querySelector('mat-icon')).not.toBeNull();
    });
    await step('Component is present in the DOM', async () => {
      await expect(canvasElement.querySelector('app-not-allowed-page')).not.toBeNull();
    });
  },
};
