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
const onShowComments = fn().mockName('showCommentsChanged');

/** The menu renders into a CDK overlay, which is attached to the body rather than to the canvas. */
const overlay = () => within(document.body);

const openMenu = async () => {
  onVisibility.mockClear();
  onAllVisibility.mockClear();
  onRowHeight.mockClear();
  onShowComments.mockClear();
  await userEvent.click(overlay().getByRole('button', { name: /View options/i }));
};

const meta: Meta<TableViewOptionsComponent> = {
  title: 'Data Browser / View Options / Column picker',
  component: TableViewOptionsComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  render: args => ({
    props: { ...args, onVisibility, onAllVisibility, onRowHeight, onShowComments },
    template: `<app-table-view-options
      [entries]="entries"
      [rowHeight]="rowHeight"
      [showComments]="showComments"
      (rowHeightChanged)="onRowHeight($event)"
      (showCommentsChanged)="onShowComments($event)"
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
    showComments: { description: 'Whether value comments are shown under their values.' },
    showCommentsChanged: { description: 'Emits whether comments should be shown once the user ticks the option.' },
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
    await expect(menu.queryByText(/of 4 shown/)).toBeNull();
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

export const LeavesTheLabelColumnOutOfTheList: Story = {
  play: async () => {
    await openMenu();

    await expect(overlay().queryByRole('menuitemcheckbox', { name: /Label/ })).toBeNull();
    await expect(overlay().getByRole('menuitemcheckbox', { name: /Title/ })).toBeInTheDocument();
  },
};

export const OffersNoDensityChoice: Story = {
  play: async () => {
    await openMenu();

    await expect(overlay().queryAllByRole('menuitemradio')).toHaveLength(0);
  },
};

// ── Showing or hiding every column at once ──────────────────────────────────

export const OffersHideAllWhileEveryColumnIsShown: Story = {
  args: { entries: ENTRIES.map(e => ({ ...e, isVisible: true })) },
  play: async () => {
    await openMenu();
    const link = overlay().getByRole('button', { name: 'Hide all columns' });

    await expect(link).toHaveTextContent('Hide all');
    await userEvent.click(link);

    await expect(onAllVisibility).toHaveBeenCalledWith(false);
  },
};

export const OffersShowAllOnceAnyColumnIsHidden: Story = {
  play: async () => {
    await openMenu();
    const link = overlay().getByRole('button', { name: 'Show all columns' });

    await expect(link).toHaveTextContent('Show all');
    await userEvent.click(link);

    await expect(onAllVisibility).toHaveBeenCalledWith(true);
  },
};

export const IgnoresTheStickyColumnWhenDecidingWhichActionToOffer: Story = {
  args: { entries: ENTRIES.map(e => ({ ...e, isVisible: e.column.isSticky })) },
  play: async () => {
    await openMenu();

    await expect(overlay().getByRole('button', { name: 'Show all columns' })).toBeInTheDocument();
  },
};

// ── Row height ──────────────────────────────────────────────────────────────

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

export const ListsCommentsFirstAsASwitchRatherThanAColumn: Story = {
  play: async () => {
    await openMenu();
    const headers = Array.from(document.querySelectorAll('.view-options-panel .section-header')).map(header =>
      header.textContent?.trim()
    );

    await expect(headers[0]).toBe('Comments');
    await expect(overlay().queryByRole('menuitemcheckbox', { name: /Show comments/ })).toBeNull();
    await expect(overlay().getByRole('switch', { name: /Show comments/ })).toBeInTheDocument();
  },
};

export const AsksToShowCommentsWhenTheSwitchIsTurnedOn: Story = {
  args: { showComments: false },
  play: async () => {
    await openMenu();
    const option = overlay().getByRole('switch', { name: /Show comments/ });

    await expect(option).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(option);

    await expect(onShowComments).toHaveBeenCalledWith(true);
    // The menu stays open, like the row-height control.
    await expect(overlay().getByRole('switch', { name: /Show comments/ })).toBeInTheDocument();
  },
};

export const AsksToHideCommentsWhenTheSwitchIsTurnedOff: Story = {
  args: { showComments: true },
  play: async () => {
    await openMenu();
    await userEvent.click(overlay().getByRole('switch', { name: /Show comments/ }));

    await expect(onShowComments).toHaveBeenCalledWith(false);
  },
};
