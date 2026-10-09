import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';
import { TableViewOptionsComponent } from './table-view-options.component';
import { ColumnPickerEntry } from './table-view-state.service';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/test/v2#';

function entry(key: string, label: string, isVisible: boolean): ColumnPickerEntry {
  const column: TableColumn = {
    key,
    propertyIri: key === LABEL_COLUMN_KEY ? undefined : key,
    label,
    valueType: '',
    isEditable: true,
    isSortable: true,
    isFilterable: true,
    isSticky: key === LABEL_COLUMN_KEY,
    defaultWidth: 200,
    minWidth: 90,
  };
  return { column, isVisible };
}

const ENTRIES: ColumnPickerEntry[] = [
  entry(LABEL_COLUMN_KEY, 'Label', true),
  entry(`${ONTO}hasTitle`, 'Title', true),
  entry(`${ONTO}hasPlace`, 'Place', true),
  entry(`${ONTO}hasDate`, 'Date', false),
];

const onVisibility = fn().mockName('columnVisibilityChanged');
const onAllVisibility = fn().mockName('allColumnsVisibilityChanged');
const onRowHeight = fn().mockName('rowHeightChanged');

/** The menu renders into a CDK overlay, which is attached to the body rather than to the canvas. */
const overlay = () => within(document.body);

const openMenu = async () => {
  onVisibility.mockClear();
  onAllVisibility.mockClear();
  onRowHeight.mockClear();
  await userEvent.click(overlay().getByRole('button', { name: /View options/i }));
};

const meta: Meta<TableViewOptionsComponent> = {
  title: 'Data Browser / View Options / Column picker',
  component: TableViewOptionsComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  // A host template rather than args, so each assertion runs through the real output bindings the
  // class header uses instead of poking the component's outputs directly.
  render: args => ({
    props: { ...args, onVisibility, onAllVisibility, onRowHeight },
    template: `<app-table-view-options
      [entries]="entries"
      [rowHeight]="rowHeight"
      (rowHeightChanged)="onRowHeight($event)"
      (columnVisibilityChanged)="onVisibility($event)"
      (allColumnsVisibilityChanged)="onAllVisibility($event)" />`,
  }),
  args: { entries: ENTRIES },
  argTypes: {
    entries: { description: 'Every column of the class with its current on/off state, in ontology order.' },
    columnVisibilityChanged: { description: 'Emits the column key the user toggled and its new visibility.' },
    rowHeight: { description: 'Height every row is drawn at, or undefined for Auto.' },
    rowHeightChanged: { description: 'Emits the height as the thumb moves, or undefined when Auto is picked.' },
    allColumnsVisibilityChanged: { description: 'Emits true to show every column, false to hide all but the label.' },
  },
};

export default meta;
type Story = StoryObj<TableViewOptionsComponent>;

export const ListsEveryColumnWithItsCurrentVisibility: Story = {
  play: async () => {
    await openMenu();
    const menu = overlay();

    await expect(menu.getByRole('menuitemcheckbox', { name: /Title/ })).toHaveAttribute('aria-checked', 'true');
    await expect(menu.getByRole('menuitemcheckbox', { name: /Date/ })).toHaveAttribute('aria-checked', 'false');
    await expect(menu.getByText('3 of 4 shown')).toBeInTheDocument();
  },
};

export const AsksToHideAColumnWhenItsCheckboxIsUnticked: Story = {
  play: async () => {
    await openMenu();
    await userEvent.click(overlay().getByRole('menuitemcheckbox', { name: /Place/ }));

    await expect(onVisibility).toHaveBeenCalledWith({ key: `${ONTO}hasPlace`, isVisible: false });
  },
};

export const StaysOpenSoSeveralColumnsCanBeToggledInOneGo: Story = {
  play: async () => {
    await openMenu();
    const menu = overlay();

    await userEvent.click(menu.getByRole('menuitemcheckbox', { name: /Place/ }));
    await userEvent.click(menu.getByRole('menuitemcheckbox', { name: /Date/ }));

    await expect(onVisibility).toHaveBeenCalledTimes(2);
  },
};

export const RefusesToHideTheStickyLabelColumn: Story = {
  play: async () => {
    await openMenu();
    const labelRow = overlay().getByRole('menuitemcheckbox', { name: /Label/ });

    await expect(labelRow).toBeDisabled();
    await expect(labelRow).toHaveTextContent('Always');
  },
};

/**
 * The menu used to offer a density. With one left there was nothing to choose, so the choice went
 * with it — and a radio group that cannot change anything is noise in a menu built for iterating.
 */
export const OffersNoDensityChoice: Story = {
  play: async () => {
    await openMenu();

    await expect(overlay().queryAllByRole('menuitemradio')).toHaveLength(0);
  },
};

// ── Showing or hiding every column at once ──────────────────────────────────

/**
 * With something hidden, the useful next move is to bring it back, so that is what the control
 * offers. Only one of show-all and hide-all is ever worth doing; a pair of buttons would make the
 * user read both to work out which.
 */
export const OffersShowAllWhileAnyColumnIsHidden: Story = {
  play: async () => {
    await openMenu();
    const toggle = overlay().getByRole('menuitem', { name: /Show all columns/ });

    await userEvent.click(toggle);

    await expect(onAllVisibility).toHaveBeenCalledWith(true);
  },
};

export const OffersHideAllOnceEveryColumnIsShown: Story = {
  args: { entries: ENTRIES.map(e => ({ ...e, isVisible: true })) },
  play: async () => {
    await openMenu();
    const toggle = overlay().getByRole('menuitem', { name: /Hide all columns/ });

    await userEvent.click(toggle);

    await expect(onAllVisibility).toHaveBeenCalledWith(false);
  },
};

/**
 * The sticky column cannot be hidden, so it must not count towards "everything is shown" — if it
 * did, a class whose every hideable column was already hidden would still offer to hide them.
 */
export const IgnoresTheStickyColumnWhenDecidingWhichActionToOffer: Story = {
  args: { entries: ENTRIES.map(e => ({ ...e, isVisible: e.column.isSticky })) },
  play: async () => {
    await openMenu();

    await expect(overlay().getByRole('menuitem', { name: /Show all columns/ })).toBeInTheDocument();
  },
};

// ── Row height ──────────────────────────────────────────────────────────────

/** Auto by default: no slider until the user asks for a height of their own. */
export const StartsOnAutoWithNoSlider: Story = {
  play: async () => {
    await openMenu();

    await expect(document.querySelector('[data-cy="row-height-value"]')).toHaveTextContent('Auto');
    await expect(overlay().getByRole('radio', { name: 'Auto' })).toBeChecked();
    await expect(document.querySelector('[data-cy="row-height-slider"]')).toBeNull();
  },
};

export const ShowsTheCurrentRowHeightOnManual: Story = {
  args: { rowHeight: 120 },
  play: async () => {
    await openMenu();

    await expect(document.querySelector('[data-cy="row-height-value"]')).toHaveTextContent('120px');
    await expect(overlay().getByRole('radio', { name: 'Manual' })).toBeChecked();
    await expect(document.querySelector('[data-cy="row-height-slider"]')).not.toBeNull();
  },
};

/** Manual applies a height at once, so the slider starts from what the table is showing. */
export const AppliesADefaultHeightWhenManualIsPicked: Story = {
  play: async () => {
    await openMenu();

    await userEvent.click(overlay().getByRole('radio', { name: 'Manual' }));

    await expect(onRowHeight).toHaveBeenCalledWith(96);
  },
};

export const EmitsAutoWhenAutoIsPicked: Story = {
  args: { rowHeight: 200 },
  play: async () => {
    await openMenu();

    await userEvent.click(overlay().getByRole('radio', { name: 'Auto' }));

    await expect(onRowHeight).toHaveBeenCalledWith(undefined);
  },
};

/**
 * Back to Auto and on to Manual again restores the height the user had set, not the default:
 * switching modes is not a reason to lose it. The host feeds each emission back, as the layout does.
 */
export const RestoresTheLastManualHeightWhenManualIsPickedAgain: Story = {
  args: { rowHeight: 200 },
  render: args => ({
    props: {
      ...args,
      onVisibility,
      onAllVisibility,
      onRowHeight,
      apply(this: { rowHeight?: number }, height: number | undefined) {
        this.rowHeight = height;
        onRowHeight(height);
      },
    },
    template: `<app-table-view-options
      [entries]="entries"
      [rowHeight]="rowHeight"
      (rowHeightChanged)="apply($event)" />`,
  }),
  play: async () => {
    await openMenu();

    await userEvent.click(overlay().getByRole('radio', { name: 'Auto' }));
    await expect(document.querySelector('[data-cy="row-height-slider"]')).toBeNull();

    await userEvent.click(overlay().getByRole('radio', { name: 'Manual' }));
    await expect(onRowHeight).toHaveBeenLastCalledWith(200);
    await expect(document.querySelector('[data-cy="row-height-value"]')).toHaveTextContent('200px');
  },
};

/**
 * The table follows the thumb while it is dragged: each step it crosses is emitted on `input`,
 * without waiting for the release.
 */
export const EmitsTheHeightWhileTheSliderIsDragged: Story = {
  args: { rowHeight: 120 },
  play: async () => {
    await openMenu();
    const thumb = document.querySelector('[data-cy="row-height-slider"] input') as HTMLInputElement;

    thumb.value = '200';
    thumb.dispatchEvent(new Event('input', { bubbles: true }));

    await expect(onRowHeight).toHaveBeenCalledWith(200);
  },
};
