import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { NoResultsFoundPageComponent } from './no-results-found-page.component';

const meta: Meta<NoResultsFoundPageComponent> = {
  title: 'UI / No Results Found Page / Full Page',
  component: NoResultsFoundPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<NoResultsFoundPageComponent>;

export const Default: Story = {
  name: 'Renders full-page not-found state centered on screen',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"The requested page is not found." message is visible', async () => {
      await expect(canvas.getByText('The requested page is not found.')).toBeInTheDocument();
    });
  },
};
