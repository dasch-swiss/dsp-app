import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { EDITABLE_PROPERTY_IRI, makeEditableReadResource, STORY_PROVIDERS } from '../../stories.helpers';
import { TableRowFetcherRegistry } from './row-fetcher-registry.service';
import { TableRowEditHostComponent } from './table-row-edit-host.component';

const RESOURCE = makeEditableReadResource({ label: 'BRAUT001a', values: ['42'] });

const meta: Meta<TableRowEditHostComponent> = {
  title: 'Data Browser / Table Row Edit Host / Mounting',
  component: TableRowEditHostComponent,
  decorators: [
    applicationConfig({
      // Normally provided by `DataTableComponent`, which is what owns the cache of row fetchers.
      // A story mounts the host on its own, so it has to stand in as the table.
      providers: [...STORY_PROVIDERS, TableRowFetcherRegistry],
    }),
  ],
  args: { resource: RESOURCE, propertyIri: EDITABLE_PROPERTY_IRI },
  argTypes: {
    resource: {
      description: "The row's resource, fetched in full so it carries the entityInfo the editor needs.",
    },
    propertyIri: { description: 'The property this cell shows, and the one the editor is opened on.' },
    resourceReloaded: {
      description: "Emits the row's resource as dsp-api now holds it, after the editor saved something.",
    },
  },
};

export default meta;
type Story = StoryObj<TableRowEditHostComponent>;

export const MountsTheResourceEditorsOwnValueEditor: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `data-cy="property-value"` is emitted by `PropertyValueDisplayComponent`, so finding it is
    // proof that the resource editor's own subtree mounted here — not a lookalike built for the
    // table (REQ-4.1).
    await expect(canvasElement.querySelector('[data-cy="property-value"]')).not.toBeNull();
    await expect(canvas.getByText('42')).toBeInTheDocument();
  },
};

export const SaysSoWhenThePropertyHasNoEditorToMount: Story = {
  args: { propertyIri: 'http://0.0.0.0:3333/ontology/0001/test/v2#notOnThisClass' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The resource editor drops link, file-value and geometry properties, so there is genuinely
    // nothing to mount for them. The cell says so rather than rendering an empty box.
    await expect(canvas.getByText('This property cannot be edited here')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-cy="property-value"]')).toBeNull();
  },
};
