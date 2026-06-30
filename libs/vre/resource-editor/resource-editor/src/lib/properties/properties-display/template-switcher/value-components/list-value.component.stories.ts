import { FormControl } from '@angular/forms';
import { ListNodeV2WithAllLanguages, ResourcePropertyDefinition, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { AvailableLanguage, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ListValueComponent } from './list-value.component';

const literal = (language: string, value: string): StringLiteralV2 => {
  const l = new StringLiteralV2();
  l.language = language;
  l.value = value;
  return l;
};

const makeListNode = (
  id: string,
  labels: StringLiteralV2[],
  children: ListNodeV2WithAllLanguages[] = []
): ListNodeV2WithAllLanguages => {
  const node = new ListNodeV2WithAllLanguages();
  node.id = id;
  node.label = labels[0]?.value ?? '';
  node.labels = labels;
  node.comments = [];
  node.children = children;
  return node;
};

const rootNode = makeListNode(
  'http://rdfh.ch/lists/0001/root',
  [literal('en', 'Root'), literal('de', 'Wurzel')],
  [
    makeListNode(
      'http://rdfh.ch/lists/0001/catA',
      [literal('en', 'Category A'), literal('de', 'Kategorie A')],
      [
        makeListNode('http://rdfh.ch/lists/0001/itemA1', [literal('en', 'Item A1'), literal('de', 'Element A1')]),
        makeListNode('http://rdfh.ch/lists/0001/itemA2', [literal('en', 'Item A2'), literal('de', 'Element A2')]),
      ]
    ),
    makeListNode('http://rdfh.ch/lists/0001/catB', [literal('en', 'Category B'), literal('de', 'Kategorie B')]),
  ]
);

const dspApiConnectionStub = {
  v2: {
    list: {
      getListWithAllLanguages: () => of(rootNode),
    },
  },
};

const localizationServiceStub: Partial<LocalizationService> = {
  currentLanguage$: of<AvailableLanguage>('en'),
};

const makePropertyDef = (): ResourcePropertyDefinition =>
  ({
    id: 'http://example.org/listProp',
    guiAttributes: ['hlist=<http://rdfh.ch/lists/0001/root>'],
  }) as any;

const meta: Meta<ListValueComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / List Value',
  component: ListValueComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: LocalizationService, useValue: localizationServiceStub },
      ],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl bound to the selected list node IRI.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    propertyDef: {
      description: 'ResourcePropertyDefinition containing guiAttributes with the root list IRI.',
      table: { type: { summary: 'ResourcePropertyDefinition' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ListValueComponent>;

export const DefaultView: Story = {
  name: 'Shows nested menu for list node selection',
  args: {
    control: new FormControl<string | null>(null),
    propertyDef: makePropertyDef(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Nested menu component is rendered', async () => {
      const menu = canvasElement.querySelector('app-nested-menu');
      await expect(menu).not.toBeNull();
    });
  },
};
