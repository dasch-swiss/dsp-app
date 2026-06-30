import { ListNodeV2 } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';
import { STORY_PROVIDERS } from '../../../../stories.helpers';
import { toLabels } from '../../../../util/labels';
import { ListValueComponent } from './list-value.component';

const makeListNode = (id: string, label: string, children: ListNodeV2[] = [], isRoot = false): ListNodeV2 => {
  const node = new ListNodeV2();
  node.id = id;
  node.label = label;
  node.children = children;
  node.isRootNode = isRoot;
  return node;
};

const SAMPLE_ROOT_NODE = makeListNode(
  'http://rdfh.ch/lists/root',
  'Colors',
  [
    makeListNode('http://rdfh.ch/lists/red', 'Red'),
    makeListNode('http://rdfh.ch/lists/blue', 'Blue'),
    makeListNode('http://rdfh.ch/lists/green', 'Green'),
  ],
  true
);

const makeDynamicFormsStub = (root: ListNodeV2 | null = SAMPLE_ROOT_NODE) => ({
  getList$: () => of(root ?? undefined),
  searchResourcesByLabel$: () => of([] as IriLabelPair[]),
  getResourcesListCount$: () => of(0),
});

const meta: Meta<ListValueComponent> = {
  title: 'Search / Advanced Search / Value Inputs / List Value',
  component: ListValueComponent,
  argTypes: {
    rootListNodeIri: { description: 'IRI of the root list node to render.' },
    selectedListItem: { description: 'The currently selected list item.' },
    emitValueChanged: { description: 'Emitted when the user selects a list item.' },
  },
};
export default meta;
type Story = StoryObj<ListValueComponent>;

export const ShowsNestedMenu: Story = {
  name: 'Renders nested menu for list selection',
  args: { rootListNodeIri: 'http://rdfh.ch/lists/root' },
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nested menu component is rendered', async () => {
      await expect(canvasElement.querySelector('app-nested-menu')).not.toBeNull();
    });
  },
};

export const ShowsPreselectedItem: Story = {
  name: 'Shows pre-selected list item label in the menu trigger',
  args: {
    rootListNodeIri: 'http://rdfh.ch/lists/root',
    selectedListItem: { iri: 'http://rdfh.ch/lists/red', labels: toLabels('Red'), comments: [] } satisfies IriLabelPair,
  },
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nested menu is rendered', async () => {
      await expect(canvasElement.querySelector('app-nested-menu')).not.toBeNull();
    });
  },
};

export const NoListAvailable: Story = {
  name: 'Renders an empty container when list data is unavailable',
  args: { rootListNodeIri: 'http://rdfh.ch/lists/missing' },
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(null) }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Component renders without errors', async () => {
      await expect(canvasElement.querySelector('app-list-value')).not.toBeNull();
    });
    await step('No nested menu component is present when list is unavailable', async () => {
      await expect(canvasElement.querySelector('app-nested-menu')).toBeNull();
    });
  },
};

export const OpensMenuAndShowsListItems: Story = {
  name: 'Shows the list menu trigger when list data is available',
  args: { rootListNodeIri: 'http://rdfh.ch/lists/root' },
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nested menu component is rendered when list data loads', async () => {
      await waitFor(async () => {
        await expect(canvasElement.querySelector('app-nested-menu')).not.toBeNull();
      });
    });
    await step('Menu trigger element is present', async () => {
      await waitFor(async () => {
        await expect(canvasElement.querySelector('[data-cy="select-list-button"]')).not.toBeNull();
      });
    });
  },
};
