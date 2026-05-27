import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { makeMultipleViewerServiceStub, makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { ResourceListItemComponent } from './resource-list-item.component';

const meta: Meta<ResourceListItemComponent> = {
  title: 'Pages / Data Browser / Resources List / Resource List / Resource List Item',
  component: ResourceListItemComponent,
  argTypes: {
    resource: {
      description: 'The resource to display as a list item.',
      control: 'object',
      table: { type: { summary: 'ReadResource' }, category: 'Content' },
    },
    showProjectShortname: {
      description: 'When true, shows the project shortname below the resource label.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceListItemComponent>;

export const DefaultItem: Story = {
  name: 'Shows resource label in the list item',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    resource: makeReadResource({ label: 'Book of Hours (1460)' }),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Resource label is displayed', async () => {
      await expect(canvas.getByText('Book of Hours (1460)')).toBeInTheDocument();
    });
  },
};

export const HighlightedItem: Story = {
  name: 'Applies highlighted style when resource is selected',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({
            selectedResources$: of([makeReadResource({ label: 'Book of Hours (1460)' })]),
          }),
        },
      ],
    }),
  ],
  args: {
    resource: makeReadResource({ label: 'Book of Hours (1460)' }),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Resource item is in the document', async () => {
      await expect(canvas.getByTestId('resource-list-item')).toBeInTheDocument();
    });
  },
};

export const WithSearchKeyword: Story = {
  name: 'Shows "Found in: Label" when label matches the search keyword',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({ searchKeyword: 'hours' }),
        },
      ],
    }),
  ],
  args: {
    resource: makeReadResource({ label: 'Book of Hours (1460)' }),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Found in:" section is displayed with label match', async () => {
      await expect(canvas.getByText(/Found in:/i)).toBeInTheDocument();
    });
  },
};

export const WithProjectShortname: Story = {
  name: 'Shows project shortname when showProjectShortname is true and label matches search',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({ searchKeyword: 'book' }),
        },
      ],
    }),
  ],
  args: {
    resource: makeReadResource({ label: 'Book of Hours (1460)' }),
    showProjectShortname: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Project shortname is displayed', async () => {
      await expect(canvas.getByText('testproj')).toBeInTheDocument();
    });
  },
};
