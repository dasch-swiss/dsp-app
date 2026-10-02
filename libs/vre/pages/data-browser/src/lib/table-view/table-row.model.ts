import { ReadResource } from '@dasch-swiss/dsp-js';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';

/** How many values a cell shows before it collapses the rest behind a "show more" control. */
export const COLLAPSED_VALUE_COUNT = 3;

/** One cell, resolved to the strings it will actually render. */
export interface TableCell {
  readonly columnKey: string;
  /** Every value, in the order dsp-api returned them. Empty when the resource carries none. */
  readonly values: string[];
  /** The first `COLLAPSED_VALUE_COUNT` of them, so the collapsed branch needs no slicing. */
  readonly collapsedValues: string[];
  /** How many values the collapsed branch hides. Zero when the cell is not collapsible. */
  readonly hiddenCount: number;
  readonly isCollapsible: boolean;
  /** True when the resource carries no value for this property. */
  readonly isEmpty: boolean;
}

/**
 * One row, with every cell pre-resolved.
 *
 * Built once per data emission rather than read per cell in the template. At 25 rows by 40 columns
 * a `getValues()` call in a binding is a thousand calls per change-detection pass, and under
 * `OnPush` with sticky columns that pass runs more often than the data changes.
 *
 * `cells` is a plain record rather than a `Map` for the same reason: the template reaches a cell by
 * property access instead of a method call.
 */
export interface TableRow {
  readonly resource: ReadResource;
  /** The resource IRI. Used as the `trackBy` key. */
  readonly id: string;
  readonly label: string;
  readonly cells: Readonly<Record<string, TableCell>>;
}

function cellFor(resource: ReadResource, column: TableColumn): TableCell {
  const raw =
    column.key === LABEL_COLUMN_KEY
      ? [resource.label]
      : // An empty default rather than `getValuesAsStringArray`'s `'?'`: a value whose string
        // representation dsp-api could not produce would otherwise be indistinguishable from a
        // literal question mark in the data. Empty falls through to the unset placeholder, which
        // at least does not assert content the resource does not have.
        resource.getValuesAsStringArray(column.propertyIri ?? '', '');

  const values = raw.filter(value => value !== '');
  const isCollapsible = values.length > COLLAPSED_VALUE_COUNT;

  return {
    columnKey: column.key,
    values,
    collapsedValues: isCollapsible ? values.slice(0, COLLAPSED_VALUE_COUNT) : values,
    hiddenCount: isCollapsible ? values.length - COLLAPSED_VALUE_COUNT : 0,
    isCollapsible,
    isEmpty: values.length === 0,
  };
}

/** Resolve a page of resources against the column model. */
export function buildRows(resources: ReadResource[], columns: TableColumn[]): TableRow[] {
  return resources.map(resource => ({
    resource,
    id: resource.id,
    label: resource.label,
    cells: columns.reduce<Record<string, TableCell>>((cells, column) => {
      cells[column.key] = cellFor(resource, column);
      return cells;
    }, {}),
  }));
}
