import {
  ListNodeV2WithAllLanguages,
  ReadListValue,
  ResourcePropertyDefinition,
  StringLiteralV2,
} from '@dasch-swiss/dsp-js';
import { AvailableLanguage, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';
import { PropertyValueService } from '../../property-value/property-value.service';

import { ListViewerComponent } from './list-viewer.component';

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
  node.hasRootNode = 'http://rdfh.ch/lists/0001/root';
  return node;
};

const rootNode = makeListNode(
  'http://rdfh.ch/lists/0001/root',
  [literal('en', 'Root'), literal('de', 'Wurzel')],
  [
    makeListNode(
      'http://rdfh.ch/lists/0001/categoryA',
      [literal('en', 'Category A'), literal('de', 'Kategorie A')],
      [makeListNode('http://rdfh.ch/lists/0001/itemA1', [literal('en', 'Item A1'), literal('de', 'Element A1')])]
    ),
    makeListNode(
      'http://rdfh.ch/lists/0001/photographs',
      [literal('en', 'Photographs')],
      [
        makeListNode(
          'http://rdfh.ch/lists/0001/portraits',
          [literal('en', 'Portraits')],
          [makeListNode('http://rdfh.ch/lists/0001/weddings', [literal('en', 'Weddings')])]
        ),
      ]
    ),
  ]
);

const dspApiConnectionStub = {
  v2: {
    list: {
      getListWithAllLanguages: () => of(rootNode),
    },
  },
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  resource$: of(undefined),
  projectShortcode$: of('0001'),
};

// StringifyStringLiteralPipe reads currentLanguage (synchronous getter), not the
// observable, so the stub needs both: the observable drives combineLatest in the
// component pipeline, the getter feeds the impure pipe.
const localizationServiceStub: Partial<LocalizationService> = {
  currentLanguage: 'en' as AvailableLanguage,
  currentLanguage$: of<AvailableLanguage>('en'),
};

const makeValue = (listNode = 'http://rdfh.ch/lists/0001/itemA1'): ReadListValue => ({ listNode }) as any;
const makePropertyDef = (): ResourcePropertyDefinition =>
  ({
    id: 'http://example.org/listProp',
    guiAttributes: ['hlist=<http://rdfh.ch/lists/0001/root>'],
  }) as any;

const meta: Meta<ListViewerComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / List Viewer',
  component: ListViewerComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
        { provide: LocalizationService, useValue: localizationServiceStub },
        // The viewer resolves its list through PropertyValueService (provided per property),
        // which reads getListWithAllLanguages from the connection stub above.
        PropertyValueService,
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

/**
 * A table column is narrower than the path and its value display breaks words anywhere: the path used to
 * squeeze every node down to a letter per line and clip its arrows (DEV-7672).
 */
export const WrapsTheListPathBetweenNodesInANarrowColumn: Story = {
  args: {
    value: makeValue('http://rdfh.ch/lists/0001/weddings'),
    propertyDef: makePropertyDef(),
  },
  decorators: [componentWrapperDecorator(story => `<div style="width: 120px; overflow-wrap: anywhere">${story}</div>`)],
  play: async ({ canvasElement, step }) => {
    const separators = await waitFor(() => {
      const icons = canvasElement.querySelectorAll<HTMLElement>('.list-path-separator');
      expect(icons).toHaveLength(2);
      return Array.from(icons);
    });

    await step('Every arrow keeps its full size', async () => {
      for (const separator of separators) {
        await expect(separator.getBoundingClientRect().width).toBe(24);
      }
    });

    await step('Every node stays on one line', async () => {
      const nodes = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-cy="list-switch"] > span'));
      await expect(nodes).toHaveLength(3);
      for (const node of nodes) {
        // Two lines are at least twice the font size tall, whatever the line height.
        await expect(node.getBoundingClientRect().height).toBeLessThan(2 * parseFloat(getComputedStyle(node).fontSize));
      }
    });
  },
};
