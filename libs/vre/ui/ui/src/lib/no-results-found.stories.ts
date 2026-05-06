import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { NoResultsFoundComponent } from './no-results-found.component';

const meta: Meta<NoResultsFoundComponent> = {
  title: 'UI / No Results Found / Empty State',
  component: NoResultsFoundComponent,
  argTypes: {
    message: {
      description: 'Supporting message shown below the "No results found" title.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    color: {
      description: 'Optional CSS color override applied to the icon, title, and message.',
      control: 'color',
      table: { type: { summary: 'string' }, category: 'Appearance' },
    },
  },
};
export default meta;
type Story = StoryObj<NoResultsFoundComponent>;

export const Default: Story = {
  name: 'Shows no results message with default styling',
  args: { message: 'Try adjusting your search filters.' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Supporting message is visible', async () => {
      await expect(canvas.getByText('Try adjusting your search filters.')).toBeInTheDocument();
    });
  },
};

export const WithCustomColor: Story = {
  name: 'Applies custom color to the empty state',
  args: {
    message: 'No items match your criteria.',
    color: '#1565c0',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Supporting message is visible', async () => {
      await expect(canvas.getByText('No items match your criteria.')).toBeInTheDocument();
    });
  },
};
