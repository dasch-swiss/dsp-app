import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { ResourceListComponent } from './resource-list.component';

const meta: Meta<ResourceListComponent> = {
  title: 'Pages / Data Browser / Resources List / Resource List',
  component: ResourceListComponent,
  argTypes: {
    resources: {
      description: 'List of resources to display.',
      control: 'object',
      table: { type: { summary: 'ReadResource[]' }, category: 'Content' },
    },
    showProjectShortname: {
      description: 'Passes through to each list item to show the project shortname.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceListComponent>;

export const MultipleResources: Story = {
  name: 'Renders all resources in the list',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    resources: [
      makeReadResource({ id: 'r1', label: 'Codex Sinaiticus' }),
      makeReadResource({ id: 'r2', label: 'Book of Hours (1460)' }),
      makeReadResource({ id: 'r3', label: 'Gutenberg Bible' }),
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All resource labels are visible', async () => {
      await expect(canvas.getByText('Codex Sinaiticus')).toBeInTheDocument();
      await expect(canvas.getByText('Book of Hours (1460)')).toBeInTheDocument();
      await expect(canvas.getByText('Gutenberg Bible')).toBeInTheDocument();
    });
  },
};

export const SingleResource: Story = {
  name: 'Renders a single resource item',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    resources: [makeReadResource({ label: 'Codex Sinaiticus' })],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Resource label is displayed', async () => {
      await expect(canvas.getByText('Codex Sinaiticus')).toBeInTheDocument();
    });
  },
};

export const EmptyList: Story = {
  name: 'Renders nothing when resource list is empty',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: { resources: [] },
  play: async ({ canvasElement, step }) => {
    await step('No resource items are rendered', async () => {
      await expect(canvasElement.querySelectorAll('[data-cy="resource-list-item"]').length).toBe(0);
    });
  },
};
