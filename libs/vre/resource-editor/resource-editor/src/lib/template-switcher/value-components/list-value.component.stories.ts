import { FormControl } from '@angular/forms';
import { ListNodeV2, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ListValueComponent } from './list-value.component';

const makeListNode = (id: string, label: string, children: ListNodeV2[] = []): ListNodeV2 => {
  const node = new ListNodeV2();
  (node as any).id = id;
  (node as any).label = label;
  (node as any).comments = [];
  (node as any).children = children;
  return node;
};

const rootNode = makeListNode('http://rdfh.ch/lists/0001/root', 'Root', [
  makeListNode('http://rdfh.ch/lists/0001/catA', 'Category A', [
    makeListNode('http://rdfh.ch/lists/0001/itemA1', 'Item A1'),
    makeListNode('http://rdfh.ch/lists/0001/itemA2', 'Item A2'),
  ]),
  makeListNode('http://rdfh.ch/lists/0001/catB', 'Category B'),
]);

const dspApiConnectionStub = {
  v2: {
    list: {
      getList: () => of(rootNode),
    },
  },
};

const makePropertyDef = (): ResourcePropertyDefinition =>
  ({
    id: 'http://example.org/listProp',
    guiAttributes: ['hlist=<http://rdfh.ch/lists/0001/root>'],
  }) as any;

const meta: Meta<ListValueComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / List Value',
  component: ListValueComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: DspApiConnectionToken, useValue: dspApiConnectionStub }],
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
