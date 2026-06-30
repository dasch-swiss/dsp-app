import { ListNodeV2WithAllLanguages, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { NestedMenuComponent } from './nested-menu.component';

// StringifyStringLiteralPipe (used in NestedMenuComponent) reads
// currentLanguage (synchronous getter), not the observable, so the stub needs
// both: the observable for any future combineLatest wiring, the getter for the
// impure pipe.
const localizationServiceStub: Partial<LocalizationService> = {
  currentLanguage: 'en' as AvailableLanguage,
  currentLanguage$: of<AvailableLanguage>('en'),
};

const literal = (language: string, value: string): StringLiteralV2 => {
  const l = new StringLiteralV2();
  l.language = language;
  l.value = value;
  return l;
};

const makeNode = (
  id: string,
  labels: StringLiteralV2[],
  children: ListNodeV2WithAllLanguages[] = [],
  isRootNode = false
): ListNodeV2WithAllLanguages => {
  const node = new ListNodeV2WithAllLanguages();
  node.id = id;
  node.label = labels[0]?.value ?? '';
  node.labels = labels;
  node.comments = [];
  node.children = children;
  node.isRootNode = isRootNode;
  return node;
};

const rootNode = makeNode(
  'http://rdfh.ch/lists/0001/root',
  [literal('en', 'Select a value'), literal('de', 'Wert auswählen')],
  [
    makeNode(
      'http://rdfh.ch/lists/0001/catA',
      [literal('en', 'Category A'), literal('de', 'Kategorie A')],
      [
        makeNode('http://rdfh.ch/lists/0001/itemA1', [literal('en', 'Item A1'), literal('de', 'Element A1')]),
        makeNode('http://rdfh.ch/lists/0001/itemA2', [literal('en', 'Item A2'), literal('de', 'Element A2')]),
      ]
    ),
    makeNode(
      'http://rdfh.ch/lists/0001/catB',
      [literal('en', 'Category B'), literal('de', 'Kategorie B')],
      [makeNode('http://rdfh.ch/lists/0001/itemB1', [literal('en', 'Item B1'), literal('de', 'Element B1')])]
    ),
  ],
  true
);

const meta: Meta<NestedMenuComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Nested Menu',
  component: NestedMenuComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: LocalizationService, useValue: localizationServiceStub }],
    }),
  ],
  argTypes: {
    data: {
      description: 'Root ListNodeV2WithAllLanguages tree to render as a nested menu.',
      table: { type: { summary: 'ListNodeV2WithAllLanguages' }, category: 'State' },
    },
    selection: {
      description: 'Labels of the currently selected node (multi-language array).',
      table: { type: { summary: 'StringLiteralV2[]' }, category: 'State' },
    },
    selectedNode: {
      description: 'Emitted when the user selects a list node.',
      table: { category: 'Events', type: { summary: 'EventEmitter<ListNodeV2WithAllLanguages>' } },
    },
  },
};
export default meta;
type Story = StoryObj<NestedMenuComponent>;

export const DefaultView: Story = {
  name: 'Shows select button for root node with children',
  args: {
    data: rootNode,
    selection: [],
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
    selection: [literal('en', 'Item A1'), literal('de', 'Element A1')],
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
    data: makeNode('http://rdfh.ch/lists/0001/itemA1', [literal('en', 'Item A1'), literal('de', 'Element A1')]),
    selection: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('List item button is rendered for leaf node', async () => {
      const button = canvasElement.querySelector('[data-cy="list-item-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
