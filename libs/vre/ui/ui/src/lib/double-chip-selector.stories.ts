import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';

import { DoubleChipSelectorComponent } from './double-chip-selector.component';

const meta: Meta<DoubleChipSelectorComponent> = {
  title: 'UI / Double Chip Selector / Toggle',
  component: DoubleChipSelectorComponent,
  argTypes: {
    value: {
      description: 'The currently selected boolean value. `true` selects the first option, `false` selects the second.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    options: {
      description: 'A tuple of two labels: [labelForTrue, labelForFalse].',
      control: 'object',
      table: { type: { summary: '[string, string]' }, category: 'Content' },
    },
    valueChange: {
      description: 'Emitted when the user selects the other option.',
      table: { category: 'Events', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
};
export default meta;
type Story = StoryObj<DoubleChipSelectorComponent>;

export const SelectsFirstOption: Story = {
  name: 'Shows first option selected when value is true',
  args: {
    value: true,
    options: ['Upload file', 'Use URL'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Upload file" chip is visible', async () => {
      await expect(canvas.getByText('Upload file')).toBeInTheDocument();
    });
  },
};

export const SelectsSecondOption: Story = {
  name: 'Shows second option selected when value is false',
  args: {
    value: false,
    options: ['Upload file', 'Use URL'],
  },
};

export const EmitsOnToggle: Story = {
  name: 'Emits valueChange when user clicks the unselected option',
  args: {
    value: true,
    options: ['Yes', 'No'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Yes" chip is initially visible', async () => {
      await expect(canvas.getByText('Yes')).toBeInTheDocument();
    });
    await step('User clicks the "No" chip', async () => {
      await userEvent.click(canvas.getByText('No'));
    });
    await step('"No" chip is still visible after click', async () => {
      await expect(canvas.getByText('No')).toBeInTheDocument();
    });
  },
};
