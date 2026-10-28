import {
  Cardinality,
  Constants,
  ReadBooleanValue,
  ReadDateValue,
  ReadIntValue,
  ReadResource,
  ReadTextValueAsString,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EDITABLE_PROPERTY_IRI, makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { rightsColumns } from './build-column-model';
import { DataTableComponent } from './data-table.component';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/test/v2#';

/** Enough of an ontology definition for the resource viewer's switcher and `GenerateProperty.commonProperty`. */
function propDef(id: string, objectType: string): ResourcePropertyDefinitionWithAllLanguages {
  return {
    id,
    objectType,
    isEditable: true,
    isLinkProperty: false,
    isLinkValueProperty: false,
    subPropertyOf: [],
    labels: [],
    comments: [],
    guiAttributes: [],
  } as unknown as ResourcePropertyDefinitionWithAllLanguages;
}

/** A definition the resource editor drops (a link property), so the cell renders as text. */
function readOnlyPropDef(id: string, objectType: string): ResourcePropertyDefinitionWithAllLanguages {
  return { ...propDef(id, objectType), isLinkProperty: true } as ResourcePropertyDefinitionWithAllLanguages;
}

function column(key: string, label: string, overrides: Partial<TableColumn> = {}): TableColumn {
  const isLabel = key === LABEL_COLUMN_KEY;
  return {
    key,
    propertyIri: isLabel ? undefined : key,
    label,
    valueType: isLabel ? '' : Constants.TextValue,
    propertyDefinition: isLabel ? undefined : propDef(key, Constants.TextValue),
    isEditable: true,
    isSortable: true,
    isFilterable: true,
    isSticky: isLabel,
    defaultWidth: 200,
    minWidth: 90,
    ...overrides,
  };
}

/** A column of `valueType`, with the matching definition — the two must not drift apart. */
function typedColumn(key: string, label: string, valueType: string): TableColumn {
  return column(key, label, { valueType, propertyDefinition: propDef(key, valueType) });
}

function readOnlyColumn(key: string, label: string, valueType: string = Constants.TextValue): TableColumn {
  return column(key, label, {
    valueType,
    propertyDefinition: readOnlyPropDef(key, valueType),
    isEditable: false,
  });
}

const COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  column(`${ONTO}hasTitle`, 'Title'),
  column(`${ONTO}hasPlace`, 'Place'),
];

const VISIBLE = COLUMNS.map(c => c.key);

/** Unique per value, because the cell's `@for` tracks by value IRI. */
let valueCounter = 0;

function seedValue<T extends ReadValue>(value: T, property: string, strval: string): T {
  value.id = `http://rdfh.ch/0001/a/values/${(valueCounter += 1)}`;
  value.property = property;
  value.strval = strval;
  // The action bubble gates Edit and Delete on the value's permission and dates Info from `valueCreationDate`.
  value.userHasPermission = 'CR';
  value.valueCreationDate = '2024-06-15T10:00:00Z';
  return value;
}

/** The switcher's default text template renders `item.text`, so `strval` alone is not enough. */
function textValue(property: string, text: string): ReadTextValueAsString {
  const value = seedValue(new ReadTextValueAsString(), property, text);
  value.text = text;
  return value;
}

function booleanValue(property: string, bool: boolean): ReadBooleanValue {
  const value = seedValue(new ReadBooleanValue(), property, String(bool));
  value.bool = bool;
  return value;
}

/** A single Gregorian day; typed off the constructor because dsp-js does not export its parse shape. */
function dateValue(property: string, year: number, month: number, day: number): ReadDateValue {
  const datestring = `GREGORIAN:${year}-${month}-${day}`;
  const parsed = {
    calendar: 'GREGORIAN',
    datestring,
    startYear: year,
    endYear: year,
    startMonth: month,
    endMonth: month,
    startDay: day,
    endDay: day,
  } as unknown as ConstructorParameters<typeof ReadDateValue>[0];

  return seedValue(new ReadDateValue(parsed), property, datestring);
}

/**
 * A resource the resource editor can mount over: `generateDspResource` reads
 * `entityInfo.classes[type].getResourcePropertiesList()`. `userHasPermission` must be a string
 * `PermissionUtil` knows, or `buildRows` refuses to model the resource.
 */
function resource(
  id: string,
  label: string,
  values: Record<string, ReadValue[]>,
  columns: TableColumn[] = COLUMNS,
  userHasPermission = 'CR'
): ReadResource {
  const type = 'http://0.0.0.0:3333/ontology/0001/test/v2#Book';

  return makeReadResource({
    id,
    label,
    type,
    userHasPermission,
    properties: values,
    getValues: (property: string) => values[property] ?? [],
    getValuesAs: (property: string) => values[property] ?? [],
    entityInfo: {
      classes: {
        [type]: {
          labels: [{ language: 'en', value: 'Book' }],
          getResourcePropertiesList: () =>
            columns
              .filter(tableColumn => tableColumn.propertyDefinition !== undefined)
              .map((tableColumn, index) => ({
                propertyIndex: tableColumn.propertyIri,
                cardinality: Cardinality._0_n,
                guiOrder: index + 1,
                propertyDefinition: tableColumn.propertyDefinition,
              })),
        },
      },
      properties: {},
      getPropertyDefinitionsByType: () => [],
    },
  } as unknown as Partial<ReadResource>);
}

function texts(property: string, ...values: string[]): Record<string, ReadValue[]> {
  return { [property]: values.map(value => textValue(property, value)) };
}

const ROWS = [
  resource('http://rdfh.ch/0001/a', 'BRAUT001a', {
    ...texts(`${ONTO}hasTitle`, 'Brautpaar in Tracht'),
    ...texts(`${ONTO}hasPlace`, 'Moskau'),
  }),
  resource('http://rdfh.ch/0001/b', 'BRAUT001b', {
    ...texts(`${ONTO}hasTitle`, 'Hochzeitszug'),
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
    rowHeight: { description: 'Height every row is drawn at from View options; undefined for Auto.' },
    showComments: {
      description: 'Whether value comments show under their values, from View options; undefined keeps the stored setting.',
    },
    selectionActive: { description: 'Whether a comparison set is being built; every row then shows its checkbox.' },
    selectable: { description: 'Whether rows can be selected for comparison; off for anonymous visitors.' },
    sortedColumnKey: { description: 'Column the query is sorted by, so its header announces aria-sort.' },
    sortDescending: { description: 'Direction of that sort.' },
    filteredColumnKeys: { description: 'Keys of the columns a filter chip currently exists on.' },
    checkedResourceIds: { description: 'IRIs in the comparison selection, so those rows read as checked.' },
    resourceCheckedChanged: { description: 'Emits a row and whether its checkbox is now checked.' },
    columnsReordered: { description: 'Emits the whole new display order after a header is dragged.' },
    columnResized: { description: 'Emits a column key and its new pixel width once a resize gesture ends.' },
    columnWidthReset: { description: 'Emits a column key when Home on its resize handle drops its stored width.' },
    sortToggled: { description: 'Emits the column to sort by and the direction the click asks for.' },
    filterRequested: { description: 'Emits the column whose filter the user wants to edit.' },
    pinnedColumns: { description: 'Keys of the columns pinned after the label, in display order.' },
    columnPinToggled: { description: 'Emits the column whose pin the user toggled.' },
    resourceReloaded: {
      description: "Emits a row's resource after a cell saved, deleted or reordered one of its values.",
    },
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

// ── Cell rendering ──────────────────────────────────────────────────────────

const DATE_PROPERTY = `${ONTO}hasDate`;
const BOOLEAN_PROPERTY = `${ONTO}isPublished`;
const LINK_PROPERTY = `${ONTO}hasAuthorValue`;

const TYPED_COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  typedColumn(DATE_PROPERTY, 'Date', Constants.DateValue),
  typedColumn(BOOLEAN_PROPERTY, 'Published', Constants.BooleanValue),
];

/** `strval` cannot express these: dsp-api ships a date as `GREGORIAN:2024-6-15` and a boolean as "true". */
export const RendersTypedValuesThroughTheViewersOwnTemplates: Story = {
  args: {
    columns: TYPED_COLUMNS,
    visibleColumns: TYPED_COLUMNS.map(c => c.key),
    resources: [
      resource(
        'http://rdfh.ch/0001/t',
        'BRAUT001a',
        {
          [DATE_PROPERTY]: [dateValue(DATE_PROPERTY, 2024, 6, 15)],
          [BOOLEAN_PROPERTY]: [booleanValue(BOOLEAN_PROPERTY, true)],
        },
        TYPED_COLUMNS
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelector('[data-cy="date-text"]')?.textContent?.trim()).toBe('15.06.2024');
    await expect(canvasElement.querySelector('[data-cy="calendar-marker"]')).not.toBeNull();
    await expect(canvas.queryByText(/GREGORIAN:/)).toBeNull();

    const toggle = canvas.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(toggle).toBeDisabled();
    await expect(canvas.queryByText('true')).toBeNull();
  },
};

const READ_ONLY_COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  readOnlyColumn(LINK_PROPERTY, 'Author'),
  typedColumn(BOOLEAN_PROPERTY, 'Published', Constants.BooleanValue),
];

export const RendersAColumnTheEditorCannotOpenAsPlainText: Story = {
  args: {
    columns: READ_ONLY_COLUMNS,
    visibleColumns: READ_ONLY_COLUMNS.map(c => c.key),
    resources: [
      resource(
        'http://rdfh.ch/0001/g',
        'BRAUT001a',
        {
          ...texts(LINK_PROPERTY, 'Petrowa, Anna'),
          [BOOLEAN_PROPERTY]: [booleanValue(BOOLEAN_PROPERTY, false)],
        },
        READ_ONLY_COLUMNS
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cells = Array.from(canvasElement.querySelectorAll('td'));
    const authorCell = cells[1];

    await expect(authorCell.querySelector('app-table-property-cell')).toBeNull();
    await expect(authorCell.textContent).toContain('Petrowa, Anna');

    await expect(canvasElement.querySelector('mat-slide-toggle')).not.toBeNull();
    await expect(canvas.getByText('BRAUT001a')).toBeInTheDocument();
  },
};

export const LeavesAnEmptyEditableCellToTheViewersOwnAddControl: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptyCell = canvasElement.querySelectorAll('tr.mat-mdc-row')[1].querySelectorAll('td')[2];

    await expect(emptyCell.querySelector('app-table-property-cell')).not.toBeNull();
    await expect(emptyCell.querySelector('.cell-empty')).toBeNull();
    await expect(canvas.queryByText('— not set')).toBeNull();
  },
};

// ── Value comments ──────────────────────────────────────────────────────────

const COMMENT = 'Title taken from the back of the print';

const commentedRows = () => {
  const title = textValue(`${ONTO}hasTitle`, 'Brautpaar in Tracht');
  title.valueHasComment = COMMENT;
  return [resource('http://rdfh.ch/0001/c', 'BRAUT001c', { [`${ONTO}hasTitle`]: [title] })];
};

export const ShowsValueCommentsWhenViewOptionsTurnThemOn: Story = {
  args: { resources: commentedRows(), showComments: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText(COMMENT)).toBeInTheDocument());
  },
};

export const HidesValueCommentsWhenViewOptionsTurnThemOff: Story = {
  args: { resources: commentedRows(), showComments: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Brautpaar in Tracht')).toBeInTheDocument();
    await expect(canvas.queryByText(COMMENT)).toBeNull();
  },
};

/** The table's denser value padding left the comment's pointer drawn over the value above it (DEV-7671). */
export const KeepsTheCommentPointerClearOfTheValue: Story = {
  args: { resources: commentedRows(), showComments: true },
  play: async ({ canvasElement }) => {
    const comment = await waitFor(() => {
      const element = canvasElement.querySelector<HTMLElement>('[data-cy="property-value-comment"]');
      expect(element).not.toBeNull();
      return element!;
    });
    const value = within(canvasElement).getByText('Brautpaar in Tracht').getBoundingClientRect();
    const pointerTop =
      comment.getBoundingClientRect().top +
      parseFloat(getComputedStyle(comment).borderTopWidth) +
      parseFloat(getComputedStyle(comment, '::before').top);

    await expect(pointerTop).toBeGreaterThanOrEqual(value.bottom);
  },
};

const COLLAPSING_COLUMNS: TableColumn[] = [column(LABEL_COLUMN_KEY, 'Label'), readOnlyColumn(LINK_PROPERTY, 'Author')];

const manyAuthors = () =>
  resource(
    'http://rdfh.ch/0001/p',
    'Petrowa, Anna',
    texts(LINK_PROPERTY, 'Moskau', 'Kiew', 'Odessa', 'Tiflis', 'Riga'),
    COLLAPSING_COLUMNS
  );

export const MarksAnEmptyReadOnlyCellAsNotSet: Story = {
  args: {
    columns: COLLAPSING_COLUMNS,
    visibleColumns: COLLAPSING_COLUMNS.map(c => c.key),
    resources: [resource('http://rdfh.ch/0001/q', 'Sokolow, Iwan', { [LINK_PROPERTY]: [] }, COLLAPSING_COLUMNS)],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('— not set')).toBeInTheDocument();
  },
};

export const KeepsTheControlsOnACheckedRowWhileAnotherIsHovered: Story = {
  args: { selectionActive: true, checkedResourceIds: new Set(['http://rdfh.ch/0001/a']) },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[1]);

    const checkedBox = rows[0].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(checkedBox).opacity).toBe('1');
  },
};

export const ShowsEveryRowsCheckboxWhileASetIsBeingBuilt: Story = {
  args: { selectionActive: true, checkedResourceIds: new Set(['http://rdfh.ch/0001/a']) },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[0]);

    const unhovered = rows[1].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(unhovered).opacity).toBe('1');

    // Only the arrow's absence is asserted: `userEvent.hover` dispatches events but does not enter CSS `:hover`.
    const unhoveredArrow = rows[1].querySelector('.row-open') as HTMLElement;
    await expect(getComputedStyle(unhoveredArrow).opacity).toBe('0');
  },
};

export const HidesTheControlsOnIdleRowsWhenNoSetIsBeingBuilt: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[0]);

    const idle = rows[1].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(idle).opacity).toBe('0');
  },
};

export const HidesRowCheckboxesForAnonymousVisitors: Story = {
  args: { selectable: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-cy="row-check"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="row-open"]')).not.toBeNull();

    const labelCell = canvasElement.querySelector('td.is-label-cell') as HTMLElement;
    await expect(getComputedStyle(labelCell).paddingLeft).toBe('44px');
  },
};

export const ClosesTheTableWithABottomBorder: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    const border = (row: Element) => getComputedStyle(row.querySelector('td') as HTMLElement).borderBottom;

    await expect(border(rows[rows.length - 1])).toBe(border(rows[0]));
  },
};

export const CollapsesAReadOnlyCellWithMoreThanThreeValues: Story = {
  args: {
    columns: COLLAPSING_COLUMNS,
    visibleColumns: COLLAPSING_COLUMNS.map(c => c.key),
    resources: [manyAuthors()],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Moskau')).toBeInTheDocument();
    await expect(canvas.queryByText('Riga')).toBeNull();
    await expect(canvas.getByText('Show 2 more')).toBeInTheDocument();
  },
};

export const ExpandsACollapsedReadOnlyCellOnDemand: Story = {
  args: {
    columns: COLLAPSING_COLUMNS,
    visibleColumns: COLLAPSING_COLUMNS.map(c => c.key),
    resources: [manyAuthors()],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Show 2 more'));

    await expect(canvas.getByText('Riga')).toBeInTheDocument();
    await expect(canvas.getByText('Show less')).toBeInTheDocument();
  },
};

const MULTI_VALUE_COLUMNS: TableColumn[] = [column(LABEL_COLUMN_KEY, 'Label'), column(`${ONTO}hasPlace`, 'Place')];

export const RendersEveryValueOfAnEditableCellWithNoCollapse: Story = {
  args: {
    columns: MULTI_VALUE_COLUMNS,
    visibleColumns: MULTI_VALUE_COLUMNS.map(c => c.key),
    resources: [
      resource(
        'http://rdfh.ch/0001/p',
        'Petrowa, Anna',
        texts(`${ONTO}hasPlace`, 'Moskau', 'Kiew', 'Odessa', 'Tiflis', 'Riga'),
        MULTI_VALUE_COLUMNS
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Riga')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-cy="cell-more"]')).toBeNull();
  },
};

// ── Header sort and filter ──────────────────────────────────────────────────

const onSort = fn().mockName('sortToggled');
const onFilter = fn().mockName('filterRequested');

/** Host template so assertions run through the real output bindings; binding an absent arg would overwrite a component default with `undefined`. */
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

export const NamesEachHeaderActionInATooltip: Story = {
  ...headerControlsStory({}),
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole('columnheader', { name: 'Title' });
    const tooltip = () => document.querySelector('.mat-mdc-tooltip');

    const expected = { 'column-sort': 'Sort ascending', 'column-filter': 'Filter', 'column-pin': 'Pin' };
    for (const [action, text] of Object.entries(expected)) {
      const button = header.querySelector(`[data-cy="${action}"]`) as HTMLElement;
      await userEvent.hover(button);
      await waitFor(() => expect(tooltip()?.textContent?.trim()).toBe(text));
      await userEvent.unhover(button);
      await waitFor(() => expect(tooltip()).toBeNull());
    }
  },
};

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

// ── Editing in place ────────────────────────────────────────────────────────

/** Columns for the editing stories: one the resource editor can open, one it cannot. */
const EDITING_COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label', { isEditable: false }),
  typedColumn(EDITABLE_PROPERTY_IRI, 'Integer', Constants.IntValue),
  readOnlyColumn(LINK_PROPERTY, 'Author'),
];

function intValue(strval: string, userHasPermission = 'CR'): ReadValue {
  const value = seedValue(new ReadIntValue(), EDITABLE_PROPERTY_IRI, strval);
  value.int = Number(strval);
  // The action bubble gates Edit and Delete on the value's permission, not the resource's.
  value.userHasPermission = userHasPermission;
  return value;
}

const editableRow = (id: string, label: string, userHasPermission = 'CR') =>
  resource(
    id,
    label,
    {
      [EDITABLE_PROPERTY_IRI]: [intValue('42', userHasPermission)],
      ...texts(LINK_PROPERTY, 'Petrowa, Anna'),
    },
    EDITING_COLUMNS,
    userHasPermission
  );

const editingStory = (args: Story['args']): Story => ({
  args: {
    resources: [editableRow('http://rdfh.ch/0001/a', 'BRAUT001a')],
    columns: EDITING_COLUMNS,
    visibleColumns: EDITING_COLUMNS.map(c => c.key),
    ...args,
  },
});

export const MountsTheViewersOwnUnitOnlyWhereTheEditorCanOpen: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const [labelCell, integerCell, authorCell] = Array.from(canvasElement.querySelectorAll('td'));

    await expect(integerCell.querySelector('app-table-property-cell')).not.toBeNull();
    await expect(integerCell.querySelector('[data-cy="property-value"]')).not.toBeNull();

    await expect(labelCell.querySelector('app-table-property-cell')).toBeNull();
    await expect(authorCell.querySelector('app-table-property-cell')).toBeNull();
  },
};

export const KeepsScrollingCellsUnderTheFrozenColumns: Story = {
  ...editingStory({}),
  render: storyArgs => ({
    props: storyArgs,
    template: `<div style="width: 360px; height: 300px">
      <app-data-table [resources]="resources" [columns]="columns" [visibleColumns]="visibleColumns" />
    </div>`,
  }),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.table-scroll') as HTMLElement;
    const add = canvasElement.querySelector('[data-cy="add-property-value-button"]') as HTMLElement;
    const label = canvasElement.querySelector('td.is-label-cell') as HTMLElement;

    scroller.scrollLeft = add.getBoundingClientRect().left - label.getBoundingClientRect().left - 20;
    await waitFor(() => expect(add.getBoundingClientRect().right).toBeLessThan(label.getBoundingClientRect().right));

    const box = add.getBoundingClientRect();
    const stack = document.elementsFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    const addCell = add.closest('td') as HTMLElement;
    const labelAt = stack.findIndex(element => label.contains(element));
    const addAt = stack.findIndex(element => addCell.contains(element));
    await expect(labelAt).toBeGreaterThanOrEqual(0);
    await expect(addAt === -1 || labelAt < addAt).toBe(true);
  },
};

export const EditsTheLabelThroughTheViewersDialog: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('[data-cy="resource-label"]') as HTMLElement;
    await expect(label.querySelector('[data-cy="edit-label-button"]')).toBeNull();

    await userEvent.hover(label);
    await userEvent.click(label.querySelector('[data-cy="edit-label-button"]') as HTMLElement);

    await waitFor(() => expect(document.querySelector('app-edit-resource-label-dialog')).not.toBeNull());
    (document.querySelector('app-edit-resource-label-dialog [mat-dialog-close]') as HTMLElement).click();
  },
};

export const ShowsTheViewersActionBubbleWhenAValueIsHovered: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-cy="action-bubble"]')).toBeNull();

    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);

    const bubble = canvasElement.querySelector('[data-cy="action-bubble"]');
    await expect(bubble).not.toBeNull();
    await expect(bubble?.querySelector('[data-cy="edit-button"]')).not.toBeNull();
    await expect(bubble?.querySelector('[data-cy="delete-button"]')).not.toBeNull();
  },
};

export const WidensAColumnForItsEditorWhileEditing: Story = {
  ...editingStory({ columnWidths: { [EDITABLE_PROPERTY_IRI]: 120 } }),
  render: storyArgs => ({
    props: { ...storyArgs, onResize },
    template: `<app-data-table
      [resources]="resources"
      [columns]="columns"
      [visibleColumns]="visibleColumns"
      [columnWidths]="columnWidths"
      (columnResized)="onResize($event)" />`,
  }),
  beforeEach: () => {
    onResize.mockClear();
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('th[aria-label="Integer"]') as HTMLElement;
    const width = () => Math.round(header.getBoundingClientRect().width);
    await expect(width()).toBe(120);

    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.click(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);
    await waitFor(() => expect(width()).toBe(300));

    await userEvent.click(canvasElement.querySelector('[data-cy="undo-button"]') as HTMLElement);
    await waitFor(() => expect(width()).toBe(120));
    await expect(onResize).not.toHaveBeenCalled();
  },
};

export const TintsTheValueBeingEdited: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;

    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.click(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);

    await waitFor(() => expect(canvasElement.querySelector('.edit-line')).not.toBeNull());
    const editLine = canvasElement.querySelector('.edit-line') as HTMLElement;
    await expect(getComputedStyle(editLine).backgroundColor).toBe('rgb(245, 247, 249)');
    await expect(getComputedStyle(row).backgroundColor).not.toBe('rgb(245, 247, 249)');
  },
};

export const OpensTheViewersOwnEditorFromTheBubble: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.click(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);

    await expect(canvasElement.querySelector('app-property-value-edit')).not.toBeNull();
    await expect(canvasElement.querySelector('[data-cy="property-value"]')).toBeNull();
  },
};

export const OffersNoEditOrDeleteWithoutModifyPermission: Story = {
  ...editingStory({
    resources: [editableRow('http://rdfh.ch/0001/a', 'BRAUT001a', 'RV')],
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('app-table-property-cell')).not.toBeNull();

    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);

    await expect(canvasElement.querySelector('[data-cy="edit-button"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="delete-button"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="add-property-value-button"]')).toBeNull();
  },
};

export const OffersTheViewersAddControlWhereCardinalityAllowsAnotherValue: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const integerCell = Array.from(canvasElement.querySelectorAll('td'))[1];
    await expect(integerCell.querySelector('[data-cy="add-property-value-button"]')).not.toBeNull();
  },
};

// ── Selection and the side panel ────────────────────────────────────────────

const onCheck = fn().mockName('resourceCheckedChanged');

const rowControlsStory = (args: Story['args']): Story => ({
  render: storyArgs => ({
    props: {
      ...storyArgs,
      checkedResourceIds: storyArgs.checkedResourceIds ?? new Set<string>(),
      onCheck,
    },
    template: `<app-data-table
      [resources]="resources"
      [columns]="columns"
      [visibleColumns]="visibleColumns"
      [checkedResourceIds]="checkedResourceIds"
      (resourceCheckedChanged)="onCheck($event)" />`,
  }),
  args,
  beforeEach: () => {
    onCheck.mockClear();
  },
});

export const AddsARowToTheComparisonWhenItIsChecked: Story = {
  ...rowControlsStory({}),
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelectorAll('[data-cy="row-check"] input')[0] as HTMLElement);

    await expect(onCheck).toHaveBeenCalledWith({ resource: ROWS[0], checked: true });
  },
};

export const RemovesARowFromTheComparisonWhenItIsUnchecked: Story = {
  ...rowControlsStory({ checkedResourceIds: new Set(['http://rdfh.ch/0001/a']) }),
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelectorAll('[data-cy="row-check"] input')[0] as HTMLInputElement;
    await expect(checkbox.checked).toBe(true);

    await userEvent.click(checkbox);

    await expect(onCheck).toHaveBeenCalledWith({ resource: ROWS[0], checked: false });
  },
};

export const OffersTheSharedDrawerControlOnEveryRow: Story = {
  ...rowControlsStory({}),
  play: async ({ canvasElement }) => {
    const controls = canvasElement.querySelectorAll('[data-cy="row-open"] button');
    await expect(controls).toHaveLength(ROWS.length);
    await expect(controls[1]).toHaveAttribute('aria-label', 'Open BRAUT001b');
  },
};

// ── Keyboard reachability ───────────────────────────────────────────────────

const onReorder = fn().mockName('columnsReordered');
const onResize = fn().mockName('columnResized');
const onWidthReset = fn().mockName('columnWidthReset');

const keyboardStory = (): Story => ({
  render: storyArgs => ({
    props: { ...storyArgs, onReorder, onResize, onWidthReset },
    template: `<app-data-table
      [resources]="resources"
      [columns]="columns"
      [visibleColumns]="visibleColumns"
      (columnsReordered)="onReorder($event)"
      (columnResized)="onResize($event)"
      (columnWidthReset)="onWidthReset($event)" />`,
  }),
  beforeEach: () => {
    onReorder.mockClear();
    onResize.mockClear();
    onWidthReset.mockClear();
  },
});

/** CDK drag-drop has no keyboard reorder, so the header cell handles the arrow keys itself. */
export const MovesAColumnWithTheKeyboardFromItsHeader: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;
    header.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(onReorder).toHaveBeenCalledWith([LABEL_COLUMN_KEY, `${ONTO}hasPlace`, `${ONTO}hasTitle`]);
  },
};

export const RefusesToMoveAColumnInFrontOfTheStickyOne: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;
    header.focus();
    await userEvent.keyboard('{ArrowLeft}');

    await expect(onReorder).not.toHaveBeenCalled();
  },
};

export const ResizesAColumnWithTheKeyboardFromItsHandle: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    // Array.from rather than a spread: the stories tsconfig has no `dom.iterable`.
    const titleHeader = Array.from(canvasElement.querySelectorAll('th')).find(th =>
      th.querySelector('.header-label')?.textContent?.includes('Title')
    ) as HTMLElement;
    const handle = titleHeader.querySelector('[data-cy="column-resize"]') as HTMLElement;
    await expect(handle).toHaveAttribute('tabindex', '0');
    await expect(handle).toHaveAttribute('aria-valuenow', '200');

    const before = Math.round((handle.closest('th') as HTMLElement).getBoundingClientRect().width);

    handle.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(onResize).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, width: before + 16 });
  },
};

export const ShowsATruncatedHeaderNameInFullOnHover: Story = {
  args: {
    columns: [
      column(LABEL_COLUMN_KEY, 'Label'),
      column(`${ONTO}hasTitle`, 'Title of the photograph as published'),
      column(`${ONTO}hasPlace`, 'Place'),
    ],
    columnWidths: { [`${ONTO}hasTitle`]: 90 },
  },
  play: async ({ canvasElement }) => {
    const label = (name: string) =>
      Array.from(canvasElement.querySelectorAll('th .header-label')).find(element =>
        element.textContent?.includes(name)
      ) as HTMLElement;
    const tooltip = () => document.querySelector('.mat-mdc-tooltip');

    await userEvent.hover(label('Place'));
    await new Promise(resolve => setTimeout(resolve, 300));
    await expect(tooltip()).toBeNull();
    await userEvent.unhover(label('Place'));

    await userEvent.hover(label('Title'));
    await waitFor(() => expect(tooltip()).toHaveTextContent('Title of the photograph as published'));
    await userEvent.unhover(label('Title'));
  },
};

// ── Pinning ─────────────────────────────────────────────────────────────────

const onPin = fn().mockName('columnPinToggled');
const PLACE = `${ONTO}hasPlace`;
const TITLE = `${ONTO}hasTitle`;

const pinnedStory = (): Story => ({
  render: storyArgs => ({
    props: { ...storyArgs, onPin, onReorder, pinned: [PLACE], order: [LABEL_COLUMN_KEY, PLACE, TITLE] },
    template: `<div style="width: 420px; height: 300px">
      <app-data-table
        [resources]="resources"
        [columns]="columns"
        [visibleColumns]="order"
        [pinnedColumns]="pinned"
        (columnPinToggled)="onPin($event)"
        (columnsReordered)="onReorder($event)" />
    </div>`,
  }),
  beforeEach: () => {
    onPin.mockClear();
    onReorder.mockClear();
  },
});

export const TogglesAColumnsPinFromItsHeader: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const unpin = canvas.getByRole('button', { name: 'Unpin Place' });
    await expect(unpin).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Pin Title' }));
    await expect(onPin).toHaveBeenCalledWith(TITLE);
  },
};

export const KeepsAPinnedColumnInViewWhileTheTableScrolls: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.table-scroll') as HTMLElement;
    const header = (name: string) => canvasElement.querySelector(`th[aria-label="${name}"]`) as HTMLElement;
    const labelWidth = header('Label').getBoundingClientRect().width;
    const scrollerLeft = scroller.getBoundingClientRect().left;

    scroller.scrollLeft = 200;

    await waitFor(() =>
      expect(Math.round(header('Place').getBoundingClientRect().left - scrollerLeft)).toBe(Math.round(labelWidth))
    );
    await expect(header('Title').getBoundingClientRect().left - scrollerLeft).toBeLessThan(labelWidth + 200);
  },
};

export const ShadesTheFrozenEdgeOnceTheTableScrolls: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.table-scroll') as HTMLElement;
    const edge = canvasElement.querySelector('th.mat-mdc-table-sticky-border-elem-left') as HTMLElement;
    const shadow = () => canvasElement.querySelector('[data-cy="frozen-shadow"]') as HTMLElement | null;
    const alongTheEdge = () =>
      expect(Math.round(shadow()!.getBoundingClientRect().left)).toBe(Math.round(edge.getBoundingClientRect().right));

    const bodyEdge = canvasElement.querySelector('td.mat-mdc-table-sticky-border-elem-left') as HTMLElement;

    await expect(shadow()).toBeNull();
    await expect(getComputedStyle(edge).borderRightWidth).toBe('2px');
    await expect(getComputedStyle(bodyEdge).borderRightWidth).toBe('2px');
    await expect(getComputedStyle(bodyEdge).borderRightColor).not.toBe('rgba(0, 0, 0, 0)');

    scroller.scrollLeft = 200;
    scroller.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(shadow()).not.toBeNull());
    await alongTheEdge();
    const headerZ = Math.max(
      ...Array.from(canvasElement.querySelectorAll('thead th')).map(th => Number(getComputedStyle(th).zIndex) || 0)
    );
    await expect(Number(getComputedStyle(shadow()!).zIndex)).toBeGreaterThan(headerZ);
    await expect(Math.round(shadow()!.getBoundingClientRect().top)).toBe(Math.round(edge.getBoundingClientRect().top));
    await expect(getComputedStyle(bodyEdge).borderRightColor).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(edge).borderRightColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const TintsTheFrozenColumns: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const background = (selector: string) =>
      getComputedStyle(canvasElement.querySelector(selector) as HTMLElement).backgroundColor;

    await expect(background('th[aria-label="Label"]')).toBe('rgb(230, 237, 243)');
    await expect(background('th[aria-label="Place"]')).toBe('rgb(230, 237, 243)');
    await expect(background('th[aria-label="Title"]')).not.toBe('rgb(230, 237, 243)');
    await expect(background('tbody td.is-label-cell')).toBe('rgb(242, 246, 249)');
  },
};

export const ShowsThePinBeforeAPinnedColumnsName: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const place = canvas.getByRole('columnheader', { name: 'Place' });
    const pin = canvas.getByRole('button', { name: 'Unpin Place' });
    const name = place.querySelector('.header-label') as HTMLElement;

    await expect(pin.getBoundingClientRect().right).toBeLessThanOrEqual(name.getBoundingClientRect().left);

    // Focus stands in for hover, which a play function cannot produce.
    const left = name.getBoundingClientRect().left;
    place.focus();
    await waitFor(() => expect(getComputedStyle(place.querySelector('.header-sort') as HTMLElement).opacity).toBe('1'));
    await expect(getComputedStyle(pin).marginLeft).toBe('0px');
    await expect(name.getBoundingClientRect().left).toBe(left);
  },
};

export const CountsTheColumnsScrolledUnderTheFrozenOnes: Story = {
  render: storyArgs => ({
    props: {
      ...storyArgs,
      pinned: [PLACE],
      order: [LABEL_COLUMN_KEY, PLACE, TITLE, `${ONTO}hasA`, `${ONTO}hasB`, `${ONTO}hasC`],
      wideColumns: [...COLUMNS, column(`${ONTO}hasA`, 'A'), column(`${ONTO}hasB`, 'B'), column(`${ONTO}hasC`, 'C')],
      widths: { [TITLE]: 120, [`${ONTO}hasA`]: 120, [`${ONTO}hasB`]: 120, [`${ONTO}hasC`]: 400 },
    },
    template: `<div style="width: 520px; height: 300px">
      <app-data-table
        [resources]="resources"
        [columns]="wideColumns"
        [visibleColumns]="order"
        [columnWidths]="widths"
        [pinnedColumns]="pinned" />
    </div>`,
  }),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.table-scroll') as HTMLElement;
    const hint = () => canvasElement.querySelector('[data-cy="scrolled-under-hint"]');

    await expect(hint()).toBeNull();

    scroller.scrollLeft = 300;
    scroller.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(hint()).toHaveTextContent('2'));
    await expect(hint()?.getAttribute('aria-label')).toContain('2 columns scrolled under');

    await userEvent.click(hint() as HTMLElement);
    await waitFor(() => expect(scroller.scrollLeft).toBe(0));
    await waitFor(() => expect(hint()).toBeNull());
  },
};

export const RefusesToMoveAScrollingColumnInFrontOfAPin: Story = {
  ...pinnedStory(),
  play: async ({ canvasElement }) => {
    const titleHeader = canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;
    titleHeader.focus();
    await userEvent.keyboard('{ArrowLeft}');

    await expect(onReorder).not.toHaveBeenCalled();
  },
};

/** A column's right edge, dragged by `by` pixels with the pointer. */
const dragColumnEdge = (header: HTMLElement, by: number) => {
  const handle = header.querySelector('[data-cy="column-resize"]') as HTMLElement;
  // `setPointerCapture` needs a real pointer id the test never produced.
  handle.setPointerCapture = () => undefined;
  handle.releasePointerCapture = () => undefined;

  const box = handle.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const fire = (type: string, clientX: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, clientX, clientY: y, buttons: 1 })
    );

  fire('pointerdown', x);
  fire('pointermove', x + by);
  return () => fire('pointerup', x + by);
};

const titleHeader = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;

export const ResizesAColumnByDraggingItsEdge: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const header = titleHeader(canvasElement);
    const before = Math.round(header.getBoundingClientRect().width);

    const release = dragColumnEdge(header, 120);
    await expect(Math.round(header.getBoundingClientRect().width)).toBe(before + 120);
    await expect(onResize).not.toHaveBeenCalled();

    release();
    await expect(onResize).toHaveBeenCalledTimes(1);
    await expect(onResize).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, width: before + 120 });
  },
};

export const StopsAColumnAtItsMinimumWidth: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const release = dragColumnEdge(titleHeader(canvasElement), -1000);
    release();

    await expect(onResize).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, width: 90 });
  },
};

export const FitsAColumnToItsContentOnDoubleClick: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const header = titleHeader(canvasElement);
    const handle = header.querySelector('[data-cy="column-resize"]') as HTMLElement;
    const width = () => Math.round(header.getBoundingClientRect().width);
    const values = () =>
      Array.from(canvasElement.querySelectorAll('tbody td'))
        .filter(cell => (cell as HTMLTableCellElement).cellIndex === (header as HTMLTableCellElement).cellIndex)
        .flatMap(cell => Array.from(cell.querySelectorAll('.cell-value'))) as HTMLElement[];

    dragColumnEdge(header, -1000)();
    onResize.mockClear();

    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    await expect(onResize).toHaveBeenCalledTimes(1);
    await expect(width()).toBeGreaterThan(90);
    await expect(values().every(value => value.scrollWidth <= value.clientWidth)).toBe(true);

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await expect(onWidthReset).toHaveBeenCalledWith(`${ONTO}hasTitle`);
    await expect(width()).toBe(200);
  },
};

export const StoresNoWidthForAClickWithoutADrag: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    dragColumnEdge(titleHeader(canvasElement), 0)();

    await expect(onResize).not.toHaveBeenCalled();
  },
};

// ── Rights statement ────────────────────────────────────────────────────────

const RIGHTS_COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  ...rightsColumns({ license: 'License', copyrightHolder: 'Copyright holder', authorship: 'Authorship' }),
];

const RIGHTS_ROWS = [
  Object.assign(resource('http://rdfh.ch/0001/own', 'With authorship', {}, RIGHTS_COLUMNS), {
    resourceAuthorship: ['Ada Lovelace'],
  }),
  Object.assign(resource('http://rdfh.ch/0001/none', 'Without authorship', {}, RIGHTS_COLUMNS), {
    resourceAuthorship: [],
  }),
];

const PROJECT_RIGHTS = {
  licenseLabel: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  copyrightHolder: 'DaSCH',
  defaultDataAuthorship: ['Project Team'],
  isPlaceholderLicense: false,
  isPlaceholderCopyrightHolder: false,
};

const rightsStory = (): Story => ({
  render: storyArgs => ({
    props: {
      ...storyArgs,
      // Not `rows`: Storybook also sets these props on the table component, overwriting its own `rows`.
      rightsRows: RIGHTS_ROWS,
      columns: RIGHTS_COLUMNS,
      visible: RIGHTS_COLUMNS.map(rightsColumn => rightsColumn.key),
      rights: PROJECT_RIGHTS,
    },
    template: `<app-data-table
      [resources]="rightsRows"
      [columns]="columns"
      [visibleColumns]="visible"
      [projectRights]="rights" />`,
  }),
});

const cellOf = (canvasElement: HTMLElement, rowLabel: string, columnLabel: string) => {
  const headers = Array.from(canvasElement.querySelectorAll('thead th'));
  const index = headers.findIndex(th => th.getAttribute('aria-label') === columnLabel);
  const row = Array.from(canvasElement.querySelectorAll('tbody tr')).find(tr => tr.textContent?.includes(rowLabel));
  return row?.children[index] as HTMLElement;
};

export const LinksTheLicenseToItsDeed: Story = {
  ...rightsStory(),
  play: async ({ canvasElement }) => {
    const link = cellOf(canvasElement, 'With authorship', 'License').querySelector('a') as HTMLAnchorElement;

    await expect(link).toHaveTextContent('CC BY 4.0');
    await expect(link).toHaveAttribute('href', PROJECT_RIGHTS.licenseUrl);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.getAttribute('aria-label')).toContain('CC BY 4.0');
  },
};

export const ShowsTheProjectsCopyrightHolderOnEveryRow: Story = {
  ...rightsStory(),
  play: async ({ canvasElement }) => {
    await expect(cellOf(canvasElement, 'With authorship', 'Copyright holder')).toHaveTextContent('DaSCH');
    await expect(cellOf(canvasElement, 'Without authorship', 'Copyright holder')).toHaveTextContent('DaSCH');
  },
};

export const MarksTheProjectDefaultAuthorshipAsAFallback: Story = {
  ...rightsStory(),
  play: async ({ canvasElement }) => {
    const own = cellOf(canvasElement, 'With authorship', 'Authorship');
    await expect(own).toHaveTextContent('Ada Lovelace');
    await expect(own.querySelector('em')).toBeNull();

    const fallback = cellOf(canvasElement, 'Without authorship', 'Authorship').querySelector('em');
    await expect(fallback).toHaveTextContent('No authorship recorded for this resource. Project default: Project Team');
  },
};

export const EditsAuthorshipLikeTheViewer: Story = {
  ...rightsStory(),
  play: async ({ canvasElement }) => {
    const cell = cellOf(canvasElement, 'Without authorship', 'Authorship');
    const edit = cell.querySelector('[data-cy="authorship-edit"]') as HTMLElement;

    edit.focus();
    await expect(getComputedStyle(edit.closest('.value-actions') as HTMLElement).opacity).toBe('1');

    await userEvent.click(edit);
    await waitFor(() => expect(cell.querySelector('mat-chip-grid')).not.toBeNull());
    await expect(cell.querySelector('[data-cy="authorship-save"]')).not.toBeNull();
    await userEvent.click(cell.querySelector('[data-cy="authorship-cancel"]') as HTMLElement);
    await expect(cell.querySelector('mat-chip-grid')).toBeNull();
  },
};

export const GivesTheHeaderNameTheWholeWidthUntilItsControlsShow: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;
    const label = header.querySelector('.header-label') as HTMLElement;
    const controls = () =>
      Array.from(header.querySelectorAll('.header-sort, .header-filter, .header-pin')).map(control =>
        Math.round(control.getBoundingClientRect().width)
      );

    await expect(controls().every(width => width === 0)).toBe(true);
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);

    // Focus stands in for hover, which a synthetic event cannot produce.
    header.focus();

    await waitFor(() => expect(controls().every(width => width > 0)).toBe(true));
    const content = header.querySelector('.header-content') as HTMLElement;
    await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
  },
};

export const MovesAColumnByDraggingItsHeader: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-cy="column-grip"]')).toBeNull();

    const title = canvasElement.querySelector('th[aria-label="Title"]') as HTMLElement;
    const place = canvasElement.querySelector('th[aria-label="Place"]') as HTMLElement;
    const from = title.getBoundingClientRect();
    const to = place.getBoundingClientRect();
    const y = from.top + from.height / 2;
    const mouse = (target: EventTarget, type: string, x: number) =>
      // `buttons` and `detail` set: CDK ignores a press with either at 0 as a screen reader's synthetic click.
      target.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: 1, detail: 1 })
      );

    mouse(title.querySelector('.header-label') as HTMLElement, 'mousedown', from.left + 20);
    for (const x of [from.left + 30, from.left + 60, to.left + to.width / 2, to.right - 5]) {
      mouse(document, 'mousemove', x);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    mouse(document, 'mouseup', to.right - 5);

    await waitFor(() =>
      expect(onReorder).toHaveBeenCalledWith([LABEL_COLUMN_KEY, `${ONTO}hasPlace`, `${ONTO}hasTitle`])
    );
  },
};

export const AlignsEveryCellToTheTopOfATallRow: Story = {
  args: {
    resources: [
      resource('http://rdfh.ch/0001/tall', 'BRAUT001a', {
        ...texts(`${ONTO}hasTitle`, 'Brautpaar in Tracht'),
        ...texts(
          `${ONTO}hasPlace`,
          'Moskau, aufgenommen im Atelier des Fotografen an der Twerskaja, an einem Wintermorgen des Jahres 1912, ' +
            'als das Brautpaar nach der Trauung in der Christ-Erlöser-Kathedrale mit der ganzen Familie herkam, ' +
            'um sich in Tracht ablichten zu lassen — die Braut im Sarafan ihrer Großmutter, der Bräutigam in der ' +
            'Uniform seines Regiments, beide ernst, wie es sich für ein solches Bild gehörte, und hinter ihnen die ' +
            'gemalte Kulisse eines Birkenwaldes im Sommer, die der Fotograf für alle Hochzeitsbilder verwendete.'
        ),
      }),
    ],
    columnWidths: { [`${ONTO}hasPlace`]: 220 },
  },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tbody tr') as HTMLElement;
    const cells = Array.from(row.querySelectorAll('td'));
    const top = (cell: Element, selector: string) =>
      (cell.querySelector(selector) as HTMLElement).getBoundingClientRect().top - cell.getBoundingClientRect().top;
    const [labelCell, titleCell, placeCell] = cells;

    await expect(row.getBoundingClientRect().height).toBeGreaterThan(150);
    const titleTop = top(titleCell, '.cell-property');
    await expect(titleTop).toBeLessThan(12);
    await expect(Math.abs(top(placeCell, '.cell-property') - titleTop)).toBeLessThan(2);
    await expect(top(labelCell, '.cell-values')).toBeLessThan(12);
  },
};

export const DrawsColumnSeparatorsDownEveryRow: Story = {
  play: async ({ canvasElement }) => {
    const separator = (cell: Element) => getComputedStyle(cell).borderRightWidth;

    for (const row of Array.from(canvasElement.querySelectorAll('thead tr, tbody tr'))) {
      const cells = Array.from(row.children);
      const filler = cells.pop() as Element;

      for (const cell of cells) {
        const isFrozenEdge = cell.classList.contains('mat-mdc-table-sticky-border-elem-left');
        await expect(separator(cell)).toBe(isFrozenEdge ? '2px' : '1px');
      }
      await expect(separator(filler)).toBe('0px');
    }
  },
};

export const NarrowsTheLabelColumnBelowItsLongestLabel: Story = {
  args: {
    resources: [
      resource(
        'http://rdfh.ch/0001/long',
        'From Geovistory to LOD4HSS: Sustaining FAIR Knowledge Graph Practices in the Humanities and Social Sciences (DaSCHCon 2025)',
        texts(`${ONTO}hasTitle`, 'Talk')
      ),
    ],
    columnWidths: { [LABEL_COLUMN_KEY]: 220 },
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('th[aria-label="Label"]') as HTMLElement;
    const label = canvasElement.querySelector('tbody td [data-cy="resource-label"] .label-text') as HTMLElement;

    await expect(Math.round(header.getBoundingClientRect().width)).toBe(220);
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

export const ScrollsHorizontallyAtNarrowWidthsInsteadOfReflowing: Story = {
  render: storyArgs => ({
    props: storyArgs,
    template: `<div style="width: 320px">
      <app-data-table [resources]="resources" [columns]="columns" [visibleColumns]="visibleColumns" />
    </div>`,
  }),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.table-scroll') as HTMLElement;

    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await expect((canvasElement.querySelectorAll('th')[1] as HTMLElement).style.width).toBe('200px');
  },
};

export const RevealsEveryHoverOnlyControlOnKeyboardFocus: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const hidden = ['[data-cy="row-check"] input', '[data-cy="row-open"]'];

    for (const selector of hidden) {
      const control = canvasElement.querySelector(selector) as HTMLElement;
      control.focus();

      await expect(document.activeElement === control || canvasElement.contains(document.activeElement)).toBe(true);
      // The reveal is on an ancestor, so the cluster's opacity is what matters.
      const revealed = control.closest('.row-controls') ?? control;
      await expect(getComputedStyle(revealed).opacity).toBe('1');
    }
  },
};

// ── Row height ──────────────────────────────────────────────────────────────

/** Row heights are not persisted and the host is never told, so these assert the rendered result. */
const dragVertically = (handle: HTMLElement, by: number) => {
  // `setPointerCapture` needs a real pointer id the test never produced.
  handle.setPointerCapture = () => undefined;
  handle.releasePointerCapture = () => undefined;

  const box = handle.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const fire = (type: string, clientY: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, clientX: x, clientY, buttons: 1 })
    );

  fire('pointerdown', y);
  fire('pointermove', y + by);
  fire('pointerup', y + by);
};

export const ResizesARowByDraggingItsBottomEdge: Story = {
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const handle = row.querySelector('[data-cy="row-resize"]') as HTMLElement;
    const before = Math.round(row.getBoundingClientRect().height);

    dragVertically(handle, 150);

    await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThan(before + 100);
    await expect(row.style.getPropertyValue('--row-cap')).not.toBe('');
  },
};

export const ReturnsARowToItsContentOnDoubleClick: Story = {
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const handle = row.querySelector('[data-cy="row-resize"]') as HTMLElement;
    const natural = Math.round(row.getBoundingClientRect().height);
    dragVertically(handle, 150);
    await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThan(natural + 100);

    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    await expect(Math.round(row.getBoundingClientRect().height)).toBe(natural);
  },
};

export const DrawsEveryRowAtTheViewOptionsHeight: Story = {
  args: { rowHeight: 160 },
  play: async ({ canvasElement }) => {
    const rows = Array.from(canvasElement.querySelectorAll('tr.mat-mdc-row'));

    for (const row of rows) {
      await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThanOrEqual(160);
    }
  },
};

export const KeepsTheViewOptionsHeightWhenAnUndraggedRowIsReset: Story = {
  args: { rowHeight: 160 },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const handle = row.querySelector('[data-cy="row-resize"]') as HTMLElement;

    handle.focus();
    await userEvent.keyboard('{Home}');

    await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThanOrEqual(160);
  },
};

export const LetsADraggedRowOverrideTheViewOptionsHeight: Story = {
  args: { rowHeight: 160 },
  play: async ({ canvasElement }) => {
    const [dragged, other] = Array.from(canvasElement.querySelectorAll('tr.mat-mdc-row')) as HTMLElement[];
    const before = Math.round(dragged.getBoundingClientRect().height);

    dragVertically(dragged.querySelector('[data-cy="row-resize"]') as HTMLElement, 120);

    await expect(Math.round(dragged.getBoundingClientRect().height)).toBeGreaterThan(before + 80);
    await expect(Math.round(other.getBoundingClientRect().height)).toBe(before);
  },
};

export const ResetsDraggedRowsWhenTheViewOptionsHeightChanges: Story = {
  render: storyArgs => ({
    props: { ...storyArgs, rowHeight: undefined as number | undefined },
    template: `<button type="button" data-cy="apply-row-height" (click)="rowHeight = 160">160</button>
      <app-data-table
        [resources]="resources"
        [columns]="columns"
        [visibleColumns]="visibleColumns"
        [rowHeight]="rowHeight" />`,
  }),
  play: async ({ canvasElement }) => {
    const rowsNow = () => Array.from(canvasElement.querySelectorAll('tr.mat-mdc-row')) as HTMLElement[];
    const heightOf = (row: HTMLElement) => Math.round(row.getBoundingClientRect().height);

    dragVertically(rowsNow()[0].querySelector('[data-cy="row-resize"]') as HTMLElement, 260);
    await expect(heightOf(rowsNow()[0])).toBeGreaterThan(heightOf(rowsNow()[1]) + 100);

    await userEvent.click(canvasElement.querySelector('[data-cy="apply-row-height"]') as HTMLElement);

    await waitFor(() => expect(heightOf(rowsNow()[0])).toBe(heightOf(rowsNow()[1])));
    await expect(heightOf(rowsNow()[0])).toBeGreaterThanOrEqual(160);
  },
};

const manyPlaces = () =>
  resource('http://rdfh.ch/0001/many', 'Petrowa, Anna', {
    ...texts(`${ONTO}hasTitle`, 'Brautpaar in Tracht'),
    ...texts(`${ONTO}hasPlace`, ...Array.from({ length: 20 }, (_, i) => `Ort ${i + 1}`)),
  });

export const LetsATallCellGrowItsRowWhenNoHeightIsSet: Story = {
  args: { resources: [manyPlaces()] },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const cells = Array.from(row.querySelectorAll('.cell-property, .cell-values')) as HTMLElement[];

    for (const cell of cells) {
      await expect(cell).not.toHaveClass('is-capped');
    }
    await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThan(300);
  },
};

export const ScrollsATallCellOnceAHeightIsSet: Story = {
  args: { resources: [manyPlaces()], rowHeight: 120 },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const capped = row.querySelector('.is-capped') as HTMLElement;

    await expect(capped).not.toBeNull();
    await expect(capped.scrollHeight).toBeGreaterThan(capped.clientHeight);
    await expect(Math.round(row.getBoundingClientRect().height)).toBeLessThan(200);
  },
};

/** Setting a row height must not turn short cells into scroll containers: the editor's overhanging hover bubble would give each a scrollbar. */
export const LeavesShortCellsUnscrollableInASizedRow: Story = {
  args: { rowHeight: 160 },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const cells = Array.from(row.querySelectorAll('.cell-property, .cell-values')) as HTMLElement[];

    for (const cell of cells) {
      await expect(cell).not.toHaveClass('is-capped');
      await expect(getComputedStyle(cell).overflowY).toBe('visible');
    }
  },
};

export const ResizesARowWithTheKeyboardFromItsHandle: Story = {
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tr.mat-mdc-row') as HTMLElement;
    const handle = row.querySelector('[data-cy="row-resize"]') as HTMLElement;

    await expect(handle).toHaveAttribute('tabindex', '0');
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');

    const before = Math.round(row.getBoundingClientRect().height);
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');

    await expect(Math.round(row.getBoundingClientRect().height)).toBeGreaterThan(before);
  },
};
