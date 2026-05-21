import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { SortButtonComponent } from './sort-button.component';

const meta: Meta<SortButtonComponent> = {
  title: 'Pages / System / Sort Button',
  component: SortButtonComponent,
  argTypes: {
    sortProps: {
      description: 'List of sortable properties, each with a key and display label.',
      control: 'object',
      table: { type: { summary: 'SortProp[]' }, category: 'Content' },
    },
    activeKey: {
      description: 'The key of the initially active sort property.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    sortKeyChange: {
      description: 'Emitted when the user selects a different sort property.',
      table: { category: 'Events', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<SortButtonComponent>;

const defaultSortProps = [
  { key: 'longname', label: 'Project name' },
  { key: 'shortcode', label: 'Short code' },
  { key: 'shortname', label: 'Short name' },
];

export const DefaultSort: Story = {
  name: 'Shows active sort label in button text',
  decorators: [],
  args: {
    sortProps: defaultSortProps,
    activeKey: 'longname',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button displays the active sort label', async () => {
      await expect(canvas.getByText(/Sort by.*Project name/)).toBeInTheDocument();
    });
  },
};

export const OpensMenuOnClick: Story = {
  name: 'Opens sort menu when button is clicked',
  decorators: [],
  args: {
    sortProps: defaultSortProps,
    activeKey: 'shortcode',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the sort button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('All sort options are visible in the menu', async () => {
      await expect(within(document.body).getByText('Project name')).toBeInTheDocument();
      await expect(within(document.body).getByText('Short code')).toBeInTheDocument();
      await expect(within(document.body).getByText('Short name')).toBeInTheDocument();
    });
  },
};

export const EmitsSortKeyOnSelection: Story = {
  name: 'Updates label when user selects a different sort option',
  decorators: [],
  args: {
    sortProps: defaultSortProps,
    activeKey: 'longname',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Open the menu', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Select "Short code"', async () => {
      await userEvent.click(within(document.body).getByText('Short code'));
    });
    await step('Button label updates to the selected option', async () => {
      await expect(canvas.getByText(/Sort by.*Short code/)).toBeInTheDocument();
    });
  },
};
