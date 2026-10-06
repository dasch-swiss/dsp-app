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
import { expect, fn, userEvent, within } from 'storybook/test';
import { EDITABLE_PROPERTY_IRI, makeReadResource, STORY_PROVIDERS } from '../stories.helpers';
import { DataTableComponent } from './data-table.component';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/test/v2#';

/**
 * Enough of an ontology definition for the resource viewer, which is what a cell now renders and
 * edits its values through. The switcher reads `objectType` to choose the template and
 * `guiElement` to pick between the three text renderings; `GenerateProperty.commonProperty` reads
 * `isLinkProperty` and `subPropertyOf` to decide whether the property has an editor at all.
 */
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

/**
 * A definition the resource editor drops, standing in for the whole read-only family — link, file
 * value and geometry. `commonProperty` filters link properties out, so no `PropertyInfoValues`
 * reaches the cell and it renders as text (REQ-4.7).
 */
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

/** A column whose property the resource editor has no editor for, definition included. */
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
  // The action bubble gates its Edit and Delete controls on the *value's* permission, not the
  // resource's, and dates its Info tooltip from `valueCreationDate`. A value without them renders
  // a bubble with nothing in it.
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

/**
 * A single Gregorian day.
 *
 * `ReadDateValue` derives its `KnoraDate` in its constructor from dsp-js's internal parse shape,
 * which the library does not export — so the literal is built here and typed off the constructor
 * rather than restated. Equal start and end make it a date rather than a period.
 */
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
 * A resource complete enough for the resource editor to be mounted over it.
 *
 * Every property cell runs `generateDspResource`, which walks
 * `entityInfo.classes[type].getResourcePropertiesList()` — so a resource built without one falls
 * down the plain-text path and the stories stop exercising the thing they are about. The columns
 * are the source of that list, which keeps the two from drifting apart.
 *
 * `userHasPermission: 'CR'` by default: `PermissionUtil` throws on a string it does not know, and
 * `buildRows` answers that by refusing to model the resource at all, so a resource with no
 * permission would render as text everywhere. Pass `'RV'` to story a read-only user.
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

/** Text values, spelled out once so each story does not have to build them. */
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
    density: { description: 'Row height and cell padding: compact or default.' },
    selectionActive: { description: 'Whether a comparison set is being built; every row then shows its checkbox.' },
    selectedResourceId: { description: 'IRI of the resource open in the viewer, highlighted in the table.' },
    sortedColumnKey: { description: 'Column the query is sorted by, so its header announces aria-sort.' },
    sortDescending: { description: 'Direction of that sort.' },
    filteredColumnKeys: { description: 'Keys of the columns a filter chip currently exists on.' },
    checkedResourceIds: { description: 'IRIs in the comparison selection, so those rows read as checked.' },
    resourceSelected: { description: 'Emits the resource of the clicked row.' },
    resourceCheckedChanged: { description: 'Emits a row and whether its checkbox is now checked.' },
    columnsReordered: { description: 'Emits the whole new display order after a header is dragged.' },
    columnResized: { description: 'Emits a column key and its new pixel width once a resize gesture ends.' },
    sortToggled: { description: 'Emits the column to sort by and the direction the click asks for.' },
    filterRequested: { description: 'Emits the column whose filter the user wants to edit.' },
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

/**
 * The reason a cell mounts the viewer's own property unit at all (PRD §6): a value reads the same
 * in the grid as it does in the panel beside it. `strval` cannot express either of these —
 * dsp-api ships a date as `GREGORIAN:2024-6-15` and a boolean as the word "true".
 */
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

    await expect(canvas.getByText('15.06.2024')).toBeInTheDocument();
    await expect(canvas.getByText('(Gregorian)')).toBeInTheDocument();
    await expect(canvas.queryByText(/GREGORIAN:/)).toBeNull();

    const toggle = canvas.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    // Read-only until the bubble's Edit control opens the editor, exactly as in the viewer.
    await expect(toggle).toBeDisabled();
    await expect(canvas.queryByText('true')).toBeNull();
  },
};

const READ_ONLY_COLUMNS: TableColumn[] = [
  column(LABEL_COLUMN_KEY, 'Label'),
  readOnlyColumn(LINK_PROPERTY, 'Author'),
  typedColumn(BOOLEAN_PROPERTY, 'Published', Constants.BooleanValue),
];

/**
 * REQ-4.7. Link, file-value, geometry and non-editable properties are dropped by
 * `GenerateProperty.commonProperty`, so there is no `PropertyInfoValues` to hand the viewer and
 * no editor to mount. Those cells render as text — and the rest of the row is unaffected, which
 * is the other half of the claim.
 */
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

/**
 * An editable cell says it is empty the way the viewer says it: the unit collapses to its add
 * control and nothing sits above it. A placeholder there would be a second answer to the same
 * question, and a second line in every empty row of the page.
 */
export const LeavesAnEmptyEditableCellToTheViewersOwnAddControl: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptyCell = canvasElement.querySelectorAll('tr.mat-mdc-row')[1].querySelectorAll('td')[2];

    await expect(emptyCell.querySelector('app-table-property-cell')).not.toBeNull();
    await expect(emptyCell.querySelector('.cell-empty')).toBeNull();
    await expect(canvas.queryByText('— not set')).toBeNull();
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

/**
 * A read-only column has no add control, so an empty cell there would be indistinguishable from
 * one the reader has simply not scrolled to (REQ-1.6).
 */
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

/**
 * Hover is not the only reason a row shows its controls. A checked or selected row keeps them
 * regardless of where the pointer is — otherwise moving to another row hides the very checkbox
 * that says what you have collected, and a selection you have to re-find is one you cannot count.
 */
export const KeepsTheControlsOnACheckedRowWhileAnotherIsHovered: Story = {
  args: { selectionActive: true, checkedResourceIds: new Set(['http://rdfh.ch/0001/a']) },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[1]);

    const checkedBox = rows[0].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(checkedBox).opacity).toBe('1');
  },
};

/**
 * The list view's rule, not a table-specific one: `resource-list-item` renders its checkbox on
 * `showCheckbox || selectMode`, so once a set is being built every row offers one. A set you can
 * only assemble one hover at a time is a set you can never see.
 */
export const ShowsEveryRowsCheckboxWhileASetIsBeingBuilt: Story = {
  args: { selectionActive: true, checkedResourceIds: new Set(['http://rdfh.ch/0001/a']) },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[0]);

    const unhovered = rows[1].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(unhovered).opacity).toBe('1');

    // The open arrow acts on one row and says nothing about the selection, so it stays with the
    // pointer rather than joining twenty-five others in the gutter.
    //
    // Only its absence is asserted. `userEvent.hover` dispatches pointer events; it does not move
    // a real cursor, so the browser never enters the CSS `:hover` state and the positive case is
    // not reachable from a play function. It is covered by the rule itself and by manual check.
    const unhoveredArrow = rows[1].querySelector('.row-open') as HTMLElement;
    await expect(getComputedStyle(unhoveredArrow).opacity).toBe('0');
  },
};

/** With no set under way the controls stay out of the way until the pointer asks for them. */
export const HidesTheControlsOnIdleRowsWhenNoSetIsBeingBuilt: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr.mat-mdc-row');
    await userEvent.hover(rows[0]);

    const idle = rows[1].querySelector('[data-cy="row-check"]') as HTMLElement;
    await expect(getComputedStyle(idle).opacity).toBe('0');
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

/**
 * The trade made when the cell adopted the viewer's unit, pinned here so it cannot be lost by
 * accident.
 *
 * `app-property-values` renders a property's values in full — each with its own action bubble,
 * its own delete control and its own drag handle. Hiding three of them behind "show 2 more" would
 * mean hiding controls, which is worse than a tall row; and reimplementing the list so it could
 * collapse is the reimplementation this feature exists to avoid. So an editable cell has no
 * collapse at all, and a resource with a dozen values gets a dozen rows' worth of height.
 */
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

// ── Editing in place ────────────────────────────────────────────────────────

/**
 * Columns for the editing stories: one the resource editor can open, one it cannot.
 *
 * An integer property is used because it is the one value type whose editor needs nothing but a
 * number — no list fetch, no geoname lookup, no rich-text build.
 */
const EDITING_COLUMNS: TableColumn[] = [
  // The label is not a property value: no `PropertyInfoValues`, no editor, plain text.
  column(LABEL_COLUMN_KEY, 'Label', { isEditable: false }),
  typedColumn(EDITABLE_PROPERTY_IRI, 'Integer', Constants.IntValue),
  readOnlyColumn(LINK_PROPERTY, 'Author'),
];

function intValue(strval: string, userHasPermission = 'CR'): ReadValue {
  const value = seedValue(new ReadIntValue(), EDITABLE_PROPERTY_IRI, strval);
  value.int = Number(strval);
  // The action bubble gates Edit and Delete on the *value's* permission, not the resource's, so a
  // story about a read-only user has to say so twice.
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

/**
 * REQ-4.1 and the whole shape of the feature: there is no table-specific editing affordance. A
 * cell the editor can open *is* the editor's own unit, mounted in the cell; a cell it cannot open
 * is text.
 */
export const MountsTheViewersOwnUnitOnlyWhereTheEditorCanOpen: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const [labelCell, integerCell, authorCell] = Array.from(canvasElement.querySelectorAll('td'));

    await expect(integerCell.querySelector('app-table-property-cell')).not.toBeNull();
    // `data-cy="property-value"` is emitted by the resource editor's own display component, so
    // finding it is proof the viewer's subtree mounted here rather than a lookalike.
    await expect(integerCell.querySelector('[data-cy="property-value"]')).not.toBeNull();

    await expect(labelCell.querySelector('app-table-property-cell')).toBeNull();
    await expect(authorCell.querySelector('app-table-property-cell')).toBeNull();
  },
};

/**
 * The action bubble is the viewer's, not a table control: Info, Edit and Delete, revealed by
 * hovering the value rather than the cell. This is what the user asked for in so many words — a
 * cell must behave exactly like a property value in the list view.
 */
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

/** REQ-4.1 again, from the other end: the control opens the editor the resource viewer opens. */
export const OpensTheViewersOwnEditorFromTheBubble: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);
    await userEvent.click(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);

    // `app-property-value-edit` is the resource editor's own edit host — it carries the value-type
    // editor switcher, the comment control and the undo/save pair.
    await expect(canvasElement.querySelector('app-property-value-edit')).not.toBeNull();
    await expect(canvasElement.querySelector('[data-cy="property-value"]')).toBeNull();
  },
};

/**
 * REQ-4.6: the gate is the resource editor's own permission check, applied by the editor itself.
 * The table adds nothing — which is exactly why a resource the viewer would refuse to edit is not
 * editable from a cell either.
 */
export const OffersNoEditOrDeleteWithoutModifyPermission: Story = {
  ...editingStory({
    resources: [editableRow('http://rdfh.ch/0001/a', 'BRAUT001a', 'RV')],
  }),
  play: async ({ canvasElement }) => {
    // `buildRows` refuses to model a resource whose permission string it cannot parse; 'RV' is a
    // string it can, so the unit still mounts — read-only.
    await expect(canvasElement.querySelector('app-table-property-cell')).not.toBeNull();

    await userEvent.hover(canvasElement.querySelector('[data-cy="property-value"]') as HTMLElement);

    await expect(canvasElement.querySelector('[data-cy="edit-button"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="delete-button"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="add-property-value-button"]')).toBeNull();
  },
};

/** REQ-4.12: adding a value is the editor's own control, offered where cardinality allows one. */
export const OffersTheViewersAddControlWhereCardinalityAllowsAnotherValue: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const integerCell = Array.from(canvasElement.querySelectorAll('td'))[1];
    await expect(integerCell.querySelector('[data-cy="add-property-value-button"]')).not.toBeNull();
  },
};

// ── Selection and the side panel ────────────────────────────────────────────

const onCheck = fn().mockName('resourceCheckedChanged');

/**
 * Bound through a host template rather than through args so the assertions run against the real
 * output bindings the fetcher uses, the same way the header-control stories do.
 */
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

/** REQ-5.4: the row checkbox feeds the comparison selection, exactly as the list view's does. */
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

/**
 * The open control is the app's shared drawer-dialog button, not a table-specific one — a row
 * opens a resource in the same place a property or a link does. It is therefore asserted by its
 * presence and its accessible name; what it opens is `ResourceExplorerButtonComponent`'s own
 * business and is covered by that component's stories.
 */
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

const keyboardStory = (): Story => ({
  render: storyArgs => ({
    props: { ...storyArgs, onReorder, onResize },
    template: `<app-data-table
      [resources]="resources"
      [columns]="columns"
      [visibleColumns]="visibleColumns"
      (columnsReordered)="onReorder($event)"
      (columnResized)="onResize($event)" />`,
  }),
  beforeEach: () => {
    onReorder.mockClear();
    onResize.mockClear();
  },
});

/**
 * CDK drag-drop offers no keyboard reorder at all, so without the arrow keys on the grip the whole
 * feature is pointer-only.
 */
export const MovesAColumnWithTheKeyboardFromItsGrip: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const grip = canvasElement.querySelectorAll('[data-cy="column-grip"]')[0] as HTMLElement;
    grip.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(onReorder).toHaveBeenCalledWith([LABEL_COLUMN_KEY, `${ONTO}hasPlace`, `${ONTO}hasTitle`]);
  },
};

/** The sticky label column stays at index 0, for the keyboard exactly as for a drop (REQ-2.10). */
export const RefusesToMoveAColumnInFrontOfTheStickyOne: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    const grip = canvasElement.querySelectorAll('[data-cy="column-grip"]')[0] as HTMLElement;
    grip.focus();
    await userEvent.keyboard('{ArrowLeft}');

    await expect(onReorder).not.toHaveBeenCalled();
  },
};

export const ResizesAColumnWithTheKeyboardFromItsHandle: Story = {
  ...keyboardStory(),
  play: async ({ canvasElement }) => {
    // Found by its column, not by position: the label column is resizable too, so the first
    // handle in the DOM is its one.
    const titleHeader = [...canvasElement.querySelectorAll('th')].find(th =>
      th.querySelector('.header-label')?.textContent?.includes('Title')
    ) as HTMLElement;
    const handle = titleHeader.querySelector('[data-cy="column-resize"]') as HTMLElement;
    // Reachable without a pointer at all: the handle is in the tab order and announces the width
    // it is changing.
    await expect(handle).toHaveAttribute('tabindex', '0');
    await expect(handle).toHaveAttribute('aria-valuenow', '200');

    // Measured, not assumed. The table is `min-width: 100%`, so a class with few columns is
    // stretched past the widths the model asked for — and the keyboard step works from what is on
    // screen, exactly as the pointer drag does.
    const before = Math.round((handle.closest('th') as HTMLElement).getBoundingClientRect().width);

    handle.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(onResize).toHaveBeenCalledWith({ key: `${ONTO}hasTitle`, width: before + 16 });
  },
};

/**
 * REQ-1.12: a class wider than the viewport scrolls sideways rather than reflowing. The columns
 * keep the widths they were given — a table that reflowed would silently stop being a grid the
 * user can scan a property down.
 */
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
    // The header still reports the width it was told to, so nothing was squeezed to fit.
    await expect((canvasElement.querySelectorAll('th')[1] as HTMLElement).style.width).toBe('200px');
  },
};

/**
 * Every hover-revealed row control is also revealed by focus.
 *
 * Hover-only reveal makes a control unusable without a pointer. (The value action bubble inside a
 * cell is the resource editor's own and is covered by that component's stories; it behaves here
 * exactly as it does in the panel beside the table, which is the point.)
 */
export const RevealsEveryHoverOnlyControlOnKeyboardFocus: Story = {
  ...editingStory({}),
  play: async ({ canvasElement }) => {
    const hidden = ['[data-cy="row-check"] input', '[data-cy="row-open"]'];

    for (const selector of hidden) {
      const control = canvasElement.querySelector(selector) as HTMLElement;
      control.focus();

      await expect(document.activeElement === control || canvasElement.contains(document.activeElement)).toBe(true);
      // The reveal is on an ancestor, so the opacity that matters is the cluster's, not the
      // button's own.
      const revealed = control.closest('.row-controls') ?? control;
      await expect(getComputedStyle(revealed).opacity).toBe('1');
    }
  },
};
