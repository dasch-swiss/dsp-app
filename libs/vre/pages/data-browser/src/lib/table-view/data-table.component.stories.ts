import { ReadResource } from '@dasch-swiss/dsp-js';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { DataTableComponent } from './data-table.component';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/test/v2#';

function column(key: string, label: string, overrides: Partial<TableColumn> = {}): TableColumn {
  return {
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
    ...overrides,
  };
}

const COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  column(`${ONTO}hasTitle`, 'Title'),
  column(`${ONTO}hasPlace`, 'Place'),
];

const VISIBLE = COLUMNS.map(c => c.key);

/**
 * `getValuesAsStringArray` is what the row builder calls, so the stub resolves it off a plain map
 * rather than constructing real `ReadValue` instances — the table only ever sees strings.
 */
function resource(id: string, label: string, values: Record<string, string[]>): ReadResource {
  return makeReadResource({
    id,
    label,
    getValuesAsStringArray: (property: string) => values[property] ?? [],
  } as unknown as Partial<ReadResource>);
}

const ROWS = [
  resource('http://rdfh.ch/0001/a', 'BRAUT001a', {
    [`${ONTO}hasTitle`]: ['Brautpaar in Tracht'],
    [`${ONTO}hasPlace`]: ['Moskau'],
  }),
  resource('http://rdfh.ch/0001/b', 'BRAUT001b', {
    [`${ONTO}hasTitle`]: ['Hochzeitszug'],
    [`${ONTO}hasPlace`]: [],
  }),
];

const meta: Meta<DataTableComponent> = {
  title: 'Data Browser / Table / Rendering',
  component: DataTableComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: { resources: ROWS, columns: COLUMNS, visibleColumns: VISIBLE },
  argTypes: {
    resources: { description: "The page's resources, already fetched in full." },
    columns: { description: 'Every column of the class, visible or not. Drives the mounted column definitions.' },
    visibleColumns: { description: 'Keys of the columns to show, in display order. Label first.' },
    columnWidths: { description: 'Pixel widths the user has set; a column absent here uses its default.' },
    density: { description: 'Row height and cell padding: compact, default or comfortable.' },
    selectedResourceId: { description: 'IRI of the resource open in the viewer, highlighted in the table.' },
    sortedColumnKey: { description: 'Column the query is sorted by, so its header announces aria-sort.' },
    sortDescending: { description: 'Direction of that sort.' },
    filteredColumnKeys: { description: 'Keys of the columns a filter chip currently exists on.' },
    resourceSelected: { description: 'Emits the resource of the clicked row.' },
    columnsReordered: { description: 'Emits the whole new display order after a header is dragged.' },
    columnResized: { description: 'Emits a column key and its new pixel width once a resize gesture ends.' },
    sortToggled: { description: 'Emits the column to sort by and the direction the click asks for.' },
    filterRequested: { description: 'Emits the column whose filter the user wants to edit.' },
  },
};

export default meta;
type Story = StoryObj<DataTableComponent>;

export const RendersAColumnPerPropertyAndARowPerResource: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    await expect(canvas.getByText('BRAUT001a')).toBeInTheDocument();
    await expect(canvas.getByText('Hochzeitszug')).toBeInTheDocument();
  },
};

export const ShowsAPlaceholderWhereAResourceHasNoValue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // BRAUT001b carries no place; an unset cell must read as unset rather than as blank space.
    await expect(canvas.getByText('— not set')).toBeInTheDocument();
  },
};

export const CollapsesACellWithMoreThanThreeValues: Story = {
  args: {
    resources: [
      resource('http://rdfh.ch/0001/p', 'Petrowa, Anna', {
        [`${ONTO}hasPlace`]: ['Moskau', 'Kiew', 'Odessa', 'Tiflis', 'Riga'],
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Moskau')).toBeInTheDocument();
    await expect(canvas.queryByText('Riga')).toBeNull();
    await expect(canvas.getByText('Show 2 more')).toBeInTheDocument();
  },
};

export const ExpandsACollapsedCellOnDemand: Story = {
  args: {
    resources: [
      resource('http://rdfh.ch/0001/p', 'Petrowa, Anna', {
        [`${ONTO}hasPlace`]: ['Moskau', 'Kiew', 'Odessa', 'Tiflis', 'Riga'],
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Show 2 more'));

    await expect(canvas.getByText('Riga')).toBeInTheDocument();
    await expect(canvas.getByText('Show less')).toBeInTheDocument();
  },
};

export const HidesAColumnLeftOutOfTheVisibleSet: Story = {
  args: { visibleColumns: [LABEL_COLUMN_KEY, `${ONTO}hasTitle`] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: 'Place' })).toBeNull();
    // The definition stays mounted even while hidden — dropping it would make MatTable throw the
    // next time the column is shown again.
    await expect(canvas.queryByText('Moskau')).toBeNull();
  },
};

export const AnnouncesTheSortOnExactlyOneHeader: Story = {
  args: { sortedColumnKey: `${ONTO}hasTitle`, sortDescending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'Title' })).toHaveAttribute('aria-sort', 'descending');
    await expect(canvas.getByRole('columnheader', { name: 'Label' })).not.toHaveAttribute('aria-sort');
  },
};

/**
 * What a class looks like when it is reopened after the user shaped it and the browser was
 * restarted — the order, the widths and the density all come back off the persisted layout.
 */
export const RestoresAPersistedOrderWidthAndDensity: Story = {
  args: {
    visibleColumns: [LABEL_COLUMN_KEY, `${ONTO}hasPlace`, `${ONTO}hasTitle`],
    columnWidths: { [`${ONTO}hasPlace`]: 320 },
    density: 'compact',
  },
  play: async ({ canvasElement }) => {
    const headers = Array.from(canvasElement.querySelectorAll('th'));
    await expect(headers.map(th => th.querySelector('.header-label')?.textContent?.trim())).toEqual([
      'Label',
      'Place',
      'Title',
    ]);

    await expect(headers[1].style.width).toBe('320px');

    await expect(canvasElement.querySelector('.density-compact')).not.toBeNull();
  },
};

/**
 * The grip exists so the drag does not swallow the sort and filter controls Phase 5 puts in the
 * same header, and the label column has none because it must stay pinned to the left edge.
 */
export const OffersADragGripOnEveryColumnButTheStickyOne: Story = {
  play: async ({ canvasElement }) => {
    const grips = canvasElement.querySelectorAll('[data-cy="column-grip"]');
    await expect(grips).toHaveLength(2);

    const labelHeader = canvasElement.querySelector('th');
    await expect(labelHeader?.querySelector('[data-cy="column-grip"]')).toBeNull();
    await expect(labelHeader?.querySelector('[data-cy="column-resize"]')).toBeNull();
  },
};

export const HighlightsTheSelectedRow: Story = {
  args: { selectedResourceId: 'http://rdfh.ch/0001/b' },
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelectorAll('tr.is-selected');
    await expect(selected).toHaveLength(1);
    await expect(selected[0].textContent).toContain('BRAUT001b');
  },
};

// ── Header sort and filter ──────────────────────────────────────────────────

const onSort = fn().mockName('sortToggled');
const onFilter = fn().mockName('filterRequested');

/**
 * A host template rather than args, so the assertions run through the real output bindings the
 * fetcher uses. Only the inputs these stories vary are bound: `columnWidths` and `density` have
 * component defaults, and binding an absent arg would overwrite them with `undefined`.
 */
const headerControlsStory = (args: Story['args']): Story => ({
  render: storyArgs => ({
    props: {
      ...storyArgs,
      sortDescending: storyArgs.sortDescending ?? false,
      filteredColumnKeys: storyArgs.filteredColumnKeys ?? new Set<string>(),
      onSort,
      onFilter,
    },
    template: `<app-data-table
      [resources]="resources"
      [columns]="columns"
      [visibleColumns]="visibleColumns"
      [sortedColumnKey]="sortedColumnKey"
      [sortDescending]="sortDescending"
      [filteredColumnKeys]="filteredColumnKeys"
      (sortToggled)="onSort($event)"
      (filterRequested)="onFilter($event)" />`,
  }),
  args,
  beforeEach: () => {
    onSort.mockClear();
    onFilter.mockClear();
  },
});

export const SortsAscendingWhenAnUnsortedColumnIsActivated: Story = {
  ...headerControlsStory({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Title, ascending' }));

    await expect(onSort).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, descending: false });
  },
};

/**
 * Two-state, never three (REQ-3.1): activating the column that is already sorted flips the
 * direction instead of stepping through an "unsorted" state the query cannot express.
 */
export const TogglesDirectionWhenTheSortedColumnIsActivatedAgain: Story = {
  ...headerControlsStory({ sortedColumnKey: `${ONTO}hasTitle`, sortDescending: false }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('columnheader', { name: 'Title' });
    await expect(header).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Title, descending' }));

    await expect(onSort).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, descending: true });
  },
};

export const OffersNoSortControlWhereTheQueryCannotOrderBy: Story = {
  ...headerControlsStory({
    columns: [
      column(LABEL_COLUMN_KEY, 'Label'),
      column(`${ONTO}hasTitle`, 'Title'),
      // A link property: the Data tab's sort rule excludes it, so the header must offer nothing
      // rather than a control that would produce an order the list view cannot display (REQ-3.2).
      column(`${ONTO}hasPlace`, 'Place', { isSortable: false }),
    ],
  }),
  play: async ({ canvasElement }) => {
    const headers = Array.from(canvasElement.querySelectorAll('th'));
    const place = headers.find(th => th.getAttribute('aria-label') === 'Place');

    await expect(place?.querySelector('[data-cy="column-sort"]')).toBeNull();
    await expect(place?.querySelector('[data-cy="column-filter"]')).not.toBeNull();
  },
};

/**
 * Hiding the sorted column does not clear the sort — it lives in the URL, and the list view's own
 * control still shows it (REQ-3.4). The table simply has no header left to announce it on.
 */
export const KeepsTheSortWhenItsColumnIsHidden: Story = {
  ...headerControlsStory({
    visibleColumns: [LABEL_COLUMN_KEY, `${ONTO}hasTitle`],
    sortedColumnKey: `${ONTO}hasPlace`,
    sortDescending: true,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('columnheader', { name: 'Place' })).toBeNull();
    await expect(canvasElement.querySelectorAll('th[aria-sort]')).toHaveLength(0);
  },
};

export const AsksTheFilterBarToOpenTheColumnsFilter: Story = {
  ...headerControlsStory({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by Place' }));

    await expect(onFilter).toHaveBeenCalledWith(`${ONTO}hasPlace`);
  },
};

/**
 * REQ-3.7: a column already carrying a chip says so, and its control offers to edit that chip
 * rather than to add a second filter on the same property.
 */
export const MarksAColumnThatAlreadyCarriesAFilterChip: Story = {
  ...headerControlsStory({ filteredColumnKeys: new Set([`${ONTO}hasPlace`]) }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole('button', { name: 'Edit the filter on Place' });

    await expect(edit).toHaveClass('is-active');
    await expect(canvas.getByRole('button', { name: 'Filter by Title' })).not.toHaveClass('is-active');
  },
};

export const OffersNoFilterControlWhereTheBarCannotExpressOne: Story = {
  ...headerControlsStory({
    columns: [
      column(LABEL_COLUMN_KEY, 'Label'),
      column(`${ONTO}hasTitle`, 'Title'),
      column(`${ONTO}hasPlace`, 'Place', { isFilterable: false }),
    ],
  }),
  play: async ({ canvasElement }) => {
    const headers = Array.from(canvasElement.querySelectorAll('th'));
    const place = headers.find(th => th.getAttribute('aria-label') === 'Place');

    await expect(place?.querySelector('[data-cy="column-filter"]')).toBeNull();
    await expect(place?.querySelector('[data-cy="column-sort"]')).not.toBeNull();
  },
};
