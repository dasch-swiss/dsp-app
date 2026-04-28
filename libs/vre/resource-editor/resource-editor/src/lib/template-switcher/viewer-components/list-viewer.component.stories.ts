import { ListNodeV2, ReadListValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { ResourceFetcherService } from '../../representations/resource-fetcher.service';

import { ListViewerComponent } from './list-viewer.component';

const makeListNode = (id: string, label: string, children: ListNodeV2[] = []): ListNodeV2 => {
  const node = new ListNodeV2();
  (node as any).id = id;
  (node as any).label = label;
  (node as any).comments = [];
  (node as any).children = children;
  (node as any).hasRootNode = 'http://rdfh.ch/lists/0001/root';
  return node;
};

const rootNode = makeListNode('http://rdfh.ch/lists/0001/root', 'Root', [
  makeListNode('http://rdfh.ch/lists/0001/categoryA', 'Category A', [
    makeListNode('http://rdfh.ch/lists/0001/itemA1', 'Item A1'),
  ]),
]);

const dspApiConnectionStub = {
  v2: {
    list: {
      getNode: () => of(rootNode.children[0].children[0]),
      getList: () => of(rootNode),
    },
  },
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  resource$: of(undefined),
  projectShortcode$: of('0001'),
};

const makeValue = (): ReadListValue => ({ listNode: 'http://rdfh.ch/lists/0001/itemA1' }) as any;
const makePropertyDef = (): ResourcePropertyDefinition => ({ id: 'http://example.org/listProp' }) as any;

const meta: Meta<ListViewerComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / List Viewer',
  component: ListViewerComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
  argTypes: {
    value: {
      description: 'ReadListValue containing the list node IRI.',
      table: { type: { summary: 'ReadListValue' }, category: 'State' },
    },
    propertyDef: {
      description: 'ResourcePropertyDefinition for the list property.',
      table: { type: { summary: 'ResourcePropertyDefinition' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ListViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows the list node path with breadcrumb chevrons',
  args: {
    value: makeValue(),
    propertyDef: makePropertyDef(),
  },
  play: async ({ canvasElement, step }) => {
    await step('List switch container is rendered', async () => {
      const container = canvasElement.querySelector('[data-cy="list-switch"]');
      await expect(container).not.toBeNull();
    });
  },
};
