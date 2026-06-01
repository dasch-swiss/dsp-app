import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { ResourcesListComponent } from './resources-list.component';

const makeResourceResultServiceStub = (numberOfResults: number): Partial<ResourceResultService> => ({
  numberOfResults,
  MAX_RESULTS_PER_PAGE: 25,
  updatePageIndex: () => {},
});

const meta: Meta<ResourcesListComponent> = {
  title: 'Pages / Data Browser / Resources List',
  component: ResourcesListComponent,
  argTypes: {
    resources: {
      description: 'The current page of resources to display.',
      control: 'object',
      table: { type: { summary: 'ReadResource[]' }, category: 'Content' },
    },
    showProjectShortname: {
      description: 'Shows the project shortname on each list item.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    loading: {
      description: 'Replaces the resource list with a spinner while a new page is loading.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourcesListComponent>;

export const FewResults: Story = {
  name: 'Shows result count when total is below pagination threshold',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: ResourceResultService, useValue: makeResourceResultServiceStub(3) }],
    }),
  ],
  args: {
    resources: [
      makeReadResource({ id: 'r1', label: 'Codex Sinaiticus' }),
      makeReadResource({ id: 'r2', label: 'Book of Hours' }),
      makeReadResource({ id: 'r3', label: 'Gutenberg Bible' }),
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Result count is shown', async () => {
      await expect(canvas.getByText(/3 results/)).toBeInTheDocument();
    });
    await step('No pager is rendered for small result sets', async () => {
      await expect(canvas.queryByRole('navigation')).toBeNull();
    });
  },
};

export const ManyResults: Story = {
  name: 'Shows pager when total results exceed the per-page limit',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: ResourceResultService, useValue: makeResourceResultServiceStub(100) }],
    }),
  ],
  args: {
    resources: Array.from({ length: 25 }, (_, i) => makeReadResource({ id: `r${i}`, label: `Resource ${i + 1}` })),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Pager is rendered with item range info', async () => {
      await expect(canvas.getByText(/Showing/i)).toBeInTheDocument();
    });
  },
};

export const Loading: Story = {
  name: 'Shows spinner instead of list while loading',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: ResourceResultService, useValue: makeResourceResultServiceStub(25) }],
    }),
  ],
  args: {
    resources: [],
    loading: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Spinner is visible', async () => {
      await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
    });
    await step('Resource list is not rendered', async () => {
      await expect(canvas.queryByRole('list')).toBeNull();
    });
  },
};

export const SingleResult: Story = {
  name: 'Shows singular result label for exactly one result',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: ResourceResultService, useValue: makeResourceResultServiceStub(1) }],
    }),
  ],
  args: {
    resources: [makeReadResource({ label: 'Codex Sinaiticus' })],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Result count shows 1 result', async () => {
      await expect(canvas.getByText(/1 results/)).toBeInTheDocument();
    });
  },
};
