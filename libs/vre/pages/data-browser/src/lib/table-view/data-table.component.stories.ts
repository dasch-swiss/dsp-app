import { ReadResource } from '@dasch-swiss/dsp-js';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
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
    resourceSelected: { description: 'Emits the resource of the clicked row.' },
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

export const HighlightsTheSelectedRow: Story = {
  args: { selectedResourceId: 'http://rdfh.ch/0001/b' },
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelectorAll('tr.is-selected');
    await expect(selected).toHaveLength(1);
    await expect(selected[0].textContent).toContain('BRAUT001b');
  },
};
