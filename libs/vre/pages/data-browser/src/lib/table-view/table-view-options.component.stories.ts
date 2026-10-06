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

const onDensity = fn().mockName('densityChanged');
const onVisibility = fn().mockName('columnVisibilityChanged');
const onAllVisibility = fn().mockName('allColumnsVisibilityChanged');

/** The menu renders into a CDK overlay, which is attached to the body rather than to the canvas. */
const overlay = () => within(document.body);

const openMenu = async () => {
  onDensity.mockClear();
  onVisibility.mockClear();
  onAllVisibility.mockClear();
  await userEvent.click(overlay().getByRole('button', { name: /View options/i }));
};

const meta: Meta<TableViewOptionsComponent> = {
  title: 'Data Browser / View Options / Column picker',
  component: TableViewOptionsComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  // A host template rather than args, so each assertion runs through the real output bindings the
  // class header uses instead of poking the component's outputs directly.
  render: args => ({
    props: { ...args, onDensity, onVisibility, onAllVisibility },
    template: `<app-table-view-options
      [entries]="entries"
      [density]="density"
      (densityChanged)="onDensity($event)"
      (columnVisibilityChanged)="onVisibility($event)"
      (allColumnsVisibilityChanged)="onAllVisibility($event)" />`,
  }),
  args: { entries: ENTRIES, density: 'default' },
  argTypes: {
    entries: { description: 'Every column of the class with its current on/off state, in ontology order.' },
    density: { description: 'The row height currently in force: compact or default.' },
    densityChanged: { description: 'Emits the density the user picked.' },
    columnVisibilityChanged: { description: 'Emits the column key the user toggled and its new visibility.' },
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

export const ChangesTheRowDensityFromTheRadioGroup: Story = {
  play: async () => {
    await openMenu();
    const menu = overlay();

    await expect(menu.getByRole('menuitemradio', { name: /Default/ })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(menu.getByRole('menuitemradio', { name: /Compact/ }));

    await expect(onDensity).toHaveBeenCalledWith('compact');
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
