import { ListNodeV2 } from '@dasch-swiss/dsp-js';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { NestedMenuComponent } from './nested-menu.component';

const makeNode = (id: string, label: string, children: ListNodeV2[] = [], isRootNode = false): ListNodeV2 => {
  const node = new ListNodeV2();
  (node as any).id = id;
  (node as any).label = label;
  (node as any).comments = [];
  (node as any).children = children;
  (node as any).isRootNode = isRootNode;
  return node;
};

const rootNode = makeNode(
  'http://rdfh.ch/lists/0001/root',
  'Select a value',
  [
    makeNode('http://rdfh.ch/lists/0001/catA', 'Category A', [
      makeNode('http://rdfh.ch/lists/0001/itemA1', 'Item A1'),
      makeNode('http://rdfh.ch/lists/0001/itemA2', 'Item A2'),
    ]),
    makeNode('http://rdfh.ch/lists/0001/catB', 'Category B', [makeNode('http://rdfh.ch/lists/0001/itemB1', 'Item B1')]),
  ],
  true
);

const meta: Meta<NestedMenuComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / Nested Menu',
  component: NestedMenuComponent,
  argTypes: {
    data: {
      description: 'Root ListNodeV2 tree to render as a nested menu.',
      table: { type: { summary: 'ListNodeV2' }, category: 'State' },
    },
    selection: {
      description: 'Label of the currently selected node.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    selectedNode: {
      description: 'Emitted when the user selects a list node.',
      table: { category: 'Events', type: { summary: 'EventEmitter<ListNodeV2>' } },
    },
  },
};
export default meta;
type Story = StoryObj<NestedMenuComponent>;

export const DefaultView: Story = {
  name: 'Shows select button for root node with children',
  args: {
    data: rootNode,
    selection: '',
  },
  play: async ({ canvasElement, step }) => {
    await step('Select list button is rendered for root node', async () => {
      const button = canvasElement.querySelector('[data-cy="select-list-button"]');
      await expect(button).not.toBeNull();
    });
  },
};

export const WithSelection: Story = {
  name: 'Shows selected value label in the select button',
  args: {
    data: rootNode,
    selection: 'Item A1',
  },
  play: async ({ canvasElement, step }) => {
    await step('Select button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="select-list-button"]');
      await expect(button).not.toBeNull();
    });
  },
};

export const LeafNode: Story = {
  name: 'Shows a single leaf node as a menu item button',
  args: {
    data: makeNode('http://rdfh.ch/lists/0001/itemA1', 'Item A1'),
    selection: '',
  },
  play: async ({ canvasElement, step }) => {
    await step('List item button is rendered for leaf node', async () => {
      const button = canvasElement.querySelector('[data-cy="list-item-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
