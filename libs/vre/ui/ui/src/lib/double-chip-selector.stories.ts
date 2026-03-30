import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent, fn } from '@storybook/test';
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
  storyName: 'Shows first option selected when value is true',
  args: {
    value: true,
    options: ['Upload file', 'Use URL'],
    valueChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstChip = canvas.getByText('Upload file');
    await expect(firstChip).toBeInTheDocument();
  },
};

export const SelectsSecondOption: Story = {
  storyName: 'Shows second option selected when value is false',
  args: {
    value: false,
    options: ['Upload file', 'Use URL'],
    valueChange: fn(),
  },
};

export const EmitsOnToggle: Story = {
  storyName: 'Emits valueChange when user clicks the unselected option',
  args: {
    value: true,
    options: ['Yes', 'No'],
    valueChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('No'));
    await expect(args.valueChange).toHaveBeenCalled();
  },
};
