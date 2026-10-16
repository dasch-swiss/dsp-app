import { UserService } from '@dasch-swiss/vre/core/session';
import { generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  EDITABLE_PROPERTY_IRI,
  makeEditableReadResource,
  makeUserServiceStub,
  STORY_PROVIDERS,
} from '../stories.helpers';
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

const READ_ONLY_RESOURCE = generateDspResource(
  makeEditableReadResource({ label: 'BRAUT001a', values: ['42'], userHasPermission: 'RV' })
);
const readOnlyStory = (loggedIn: boolean): Story => ({
  decorators: [
    applicationConfig({
      providers: [{ provide: UserService, useValue: makeUserServiceStub({ isLoggedIn$: of(loggedIn) }) }],
    }),
  ],
  args: {
    dspResource: READ_ONLY_RESOURCE,
    myProperty: READ_ONLY_RESOURCE.resProps.find(prop => prop.propDef.id === EDITABLE_PROPERTY_IRI)!,
  },
});

/** A signed-in user who may only read still gets the creation info, as in the viewer. */
export const ShowsTheInfoButtonToASignedInReader: Story = {
  ...readOnlyStory(true),
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await expect(canvasElement.querySelector('[data-cy="info-button"]')).not.toBeNull();
  },
};

/** Logged out, a hovered cell offers nothing, so it shows nothing — no info button, no highlight. */
export const OffersNoInfoButtonWhenLoggedOut: Story = {
  ...readOnlyStory(false),
  play: async ({ canvasElement }) => {
    const value = canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement;
    await userEvent.hover(value);

    await expect(canvasElement.querySelector('[data-cy="info-button"]')).toBeNull();
    await expect(getComputedStyle(value).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  },
};

/** In a cell the Edit tooltip is just "Edit"; the viewer adds who created the value and when. */
export const ShowsAPlainEditTooltip: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.hover(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);

    await waitFor(() => expect(document.querySelector('.mat-mdc-tooltip')?.textContent?.trim()).toBe('Edit'));
  },
};

const TWO_VALUES = generateDspResource(makeEditableReadResource({ label: 'BRAUT001a', values: ['42', '43'] }));

/** The move grip is one of the value's actions, between Edit and Delete, and it moves the value. */
export const PutsTheMoveHandleBetweenEditAndDelete: Story = {
  args: {
    dspResource: TWO_VALUES,
    myProperty: TWO_VALUES.resProps.find(prop => prop.propDef.id === EDITABLE_PROPERTY_IRI)!,
  },
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);

    const bubble = canvasElement.querySelector('[data-cy="action-bubble"]') as HTMLElement;
    const order = Array.from(bubble.querySelectorAll('[data-cy]')).map(element => element.getAttribute('data-cy'));
    await expect(order).toEqual(['edit-button', 'drag-handle', 'delete-button']);

    const handle = bubble.querySelector('[data-cy="drag-handle"]') as HTMLElement;
    const box = handle.getBoundingClientRect();
    const at = (y: number) => ({ bubbles: true, clientX: box.left + 4, clientY: y, buttons: 1, detail: 1 });
    handle.dispatchEvent(new MouseEvent('mousedown', at(box.top + 4)));
    document.dispatchEvent(new MouseEvent('mousemove', at(box.top + 12)));
    document.dispatchEvent(new MouseEvent('mousemove', at(box.top + 24)));
    await waitFor(() => expect(document.querySelector('.cdk-drag-preview')).not.toBeNull());
    document.dispatchEvent(new MouseEvent('mouseup', at(box.top + 4)));
  },
};
