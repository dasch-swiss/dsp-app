import { ListNodeV2 } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent } from 'storybook/test';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';
import { STORY_PROVIDERS } from '../../../../stories.helpers';
import { ListValueComponent } from './list-value.component';

const makeListNode = (id: string, label: string, children: ListNodeV2[] = []): ListNodeV2 => {
  const node = new ListNodeV2();
  node.id = id;
  node.label = label;
  node.children = children;
  return node;
};

const SAMPLE_ROOT_NODE = makeListNode('http://rdfh.ch/lists/root', 'Colors', [
  makeListNode('http://rdfh.ch/lists/red', 'Red'),
  makeListNode('http://rdfh.ch/lists/blue', 'Blue'),
  makeListNode('http://rdfh.ch/lists/green', 'Green'),
]);

const makeDynamicFormsStub = (root: ListNodeV2 | undefined = SAMPLE_ROOT_NODE) => ({
  getList$: () => of(root),
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
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() },
      ],
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
    selectedListItem: { iri: 'http://rdfh.ch/lists/red', label: 'Red' } satisfies IriLabelPair,
  },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nested menu is rendered', async () => {
      await expect(canvasElement.querySelector('app-nested-menu')).not.toBeNull();
    });
    await step('Menu trigger shows the pre-selected item label', async () => {
      await expect(canvasElement.textContent).toContain('Red');
    });
  },
};

export const NoListAvailable: Story = {
  name: 'Renders nothing when list data is unavailable',
  args: { rootListNodeIri: 'http://rdfh.ch/lists/missing' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(undefined) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nested menu is not rendered when root node is undefined', async () => {
      await expect(canvasElement.querySelector('app-nested-menu')).toBeNull();
    });
  },
};

export const EmitsValueChangedOnItemSelection: Story = {
  name: 'Emits emitValueChanged with the selected list item when a leaf node is clicked',
  args: { rootListNodeIri: 'http://rdfh.ch/lists/root', emitValueChanged: fn() },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, args, step }) => {
    await step('Open the nested menu', async () => {
      const trigger = canvasElement.querySelector('[data-cy="select-list-button"]') as HTMLElement;
      await expect(trigger).not.toBeNull();
      await userEvent.click(trigger);
    });
    await step('Click the first leaf item', async () => {
      const item = Array.from(document.querySelectorAll('[data-cy="list-item-button"]'))[0] as HTMLElement | undefined;
      await expect(item).toBeTruthy();
      await userEvent.click(item!);
    });
    await step('emitValueChanged is called with an IriLabelPair', async () => {
      await expect(args.emitValueChanged).toHaveBeenCalledWith(
        expect.objectContaining({ iri: expect.stringContaining('rdfh.ch') })
      );
    });
  },
};
