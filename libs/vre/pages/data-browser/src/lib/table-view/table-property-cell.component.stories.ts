import { generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { EDITABLE_PROPERTY_IRI, makeEditableReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { TablePropertyCellComponent } from './table-property-cell.component';

const DSP_RESOURCE = generateDspResource(makeEditableReadResource({ label: 'BRAUT001a', values: ['42'] }));
const MY_PROPERTY = DSP_RESOURCE.resProps.find(prop => prop.propDef.id === EDITABLE_PROPERTY_IRI)!;

const meta: Meta<TablePropertyCellComponent> = {
  title: 'Data Browser / Table Property Cell / Viewer Parity',
  component: TablePropertyCellComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: { dspResource: DSP_RESOURCE, myProperty: MY_PROPERTY },
  argTypes: {
    dspResource: {
      description:
        "The row's resource as the resource editor models it. Built once per row by buildRows, and used both to seed this cell's ResourceFetcherService and as the editor's edit target.",
    },
    myProperty: {
      description: "This column's property, taken from the same resProps the resource viewer would use.",
    },
    resourceReloaded: {
      description:
        "Emits the row's resource as dsp-api holds it after the editor saved, deleted or reordered a value. Never emits for a prime.",
    },
  },
};

export default meta;
type Story = StoryObj<TablePropertyCellComponent>;

/**
 * The claim the whole change rests on: a cell is the resource viewer's property unit, not a
 * lookalike. `data-cy="property-value"` is emitted by `PropertyValueDisplayComponent`, which only
 * exists inside that subtree.
 */
export const RendersTheValueThroughTheResourceViewersOwnDisplay: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-cy="property-value"]')).not.toBeNull();
    await expect(canvas.getByText('42')).toBeInTheDocument();
  },
};

/**
 * The bubble only reaches the DOM once the fetcher it injects holds a resource — it dereferences
 * that first emission unguarded to build its Info tooltip. In a table nothing fetches per row, so
 * this is the story that proves priming happened, and happened before the subtree rendered.
 */
export const ShowsTheActionBubbleOnHoverWithInfoEditAndDelete: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);

    const bubble = canvasElement.querySelector('[data-cy="action-bubble"]');
    await expect(bubble).not.toBeNull();
    await expect(bubble?.querySelector('[data-cy="edit-button"]')).not.toBeNull();
    await expect(bubble?.querySelector('[data-cy="delete-button"]')).not.toBeNull();
  },
};

export const OpensTheResourceEditorsOwnValueEditorFromTheBubble: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.click(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);

    await expect(canvasElement.querySelector('app-property-value-edit')).not.toBeNull();
  },
};
