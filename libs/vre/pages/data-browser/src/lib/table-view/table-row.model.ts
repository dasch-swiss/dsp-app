import { ReadResource, ReadValue, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { ResourceUtil } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';

/** How many values a cell shows before it collapses the rest behind a "show more" control. */
export const COLLAPSED_VALUE_COUNT = 3;

/**
 * One cell, resolved to what it will render.
 *
 * Carries the `ReadValue`s themselves rather than their `strval`s: a cell renders each value
 * through the resource viewer's own template switcher, and that needs the value object. A date's
 * calendar, a list value's node, a link's target IRI and a boolean's `bool` are all absent from
 * the string dsp-api derives — which is why a date read `2024-06-15` in the grid and
 * `15.06.2024 (Gregorian)` two inches to the right of it.
 */
export interface TableCell {
  readonly columnKey: string;
  /**
   * The label column's text.
   *
   * Undefined on every property column, and the discriminant the table branches on. The resource
   * label is not a value: there is no `ReadValue` to hand a viewer template and no property
   * definition to pick one with, so it stays plain text.
   */
  readonly text?: string;
  /**
   * The column's property definition, needed to pick the viewer template. Undefined on the label
   * column, and on a column whose property the ontology had no definition for.
   */
  readonly propertyDefinition?: ResourcePropertyDefinitionWithAllLanguages;
  /** Every value, in the order dsp-api returned them. Empty when the resource carries none. */
  readonly values: readonly ReadValue[];
  /** The first `COLLAPSED_VALUE_COUNT` of them, so the collapsed branch needs no slicing. */
  readonly collapsedValues: readonly ReadValue[];
  /** How many values the collapsed branch hides. Zero when the cell is not collapsible. */
  readonly hiddenCount: number;
  readonly isCollapsible: boolean;
  /** True when there is nothing to render: no value for this property, or an empty label. */
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
  /**
   * Whether this user may modify this resource at all.
   *
   * The gate on every cell's edit affordance (REQ-4.6). Resolved per row rather than per cell
   * because the permission is the resource's, and asking forty times per row would be thirty-nine
   * identical answers.
   */
  readonly canEdit: boolean;
  readonly cells: Readonly<Record<string, TableCell>>;
}

/** The permission strings dsp-api issues. Anything else is not a permission we can reason about. */
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(['RV', 'V', 'M', 'D', 'CR']);

/**
 * The resource editor's own permission check, applied defensively.
 *
 * `ResourceUtil` delegates to `PermissionUtil.allUserPermissions`, which *throws* on a string it
 * does not recognise rather than answering "no". One resource with a missing `userHasPermission`
 * would otherwise take the whole page's render down, so the string is checked before it is used.
 */
function userCanEditResource(resource: ReadResource): boolean {
  return KNOWN_PERMISSIONS.has(resource.userHasPermission) && ResourceUtil.userCanEdit(resource);
}

const EMPTY_VALUES: readonly ReadValue[] = [];

function cellFor(resource: ReadResource, column: TableColumn): TableCell {
  if (column.key === LABEL_COLUMN_KEY) {
    return {
      columnKey: column.key,
      text: resource.label,
      values: EMPTY_VALUES,
      collapsedValues: EMPTY_VALUES,
      hiddenCount: 0,
      isCollapsible: false,
      isEmpty: resource.label === '',
    };
  }

  // Every value, including one whose `strval` dsp-api could not produce. The string path used to
  // drop those, because an unrenderable string is worse than nothing; a value object is not in
  // that position — the viewer templates read the typed fields, so a date with no `strval` still
  // renders as a date.
  const values = resource.getValues(column.propertyIri ?? '');
  const isCollapsible = values.length > COLLAPSED_VALUE_COUNT;

  return {
    columnKey: column.key,
    propertyDefinition: column.propertyDefinition,
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
    canEdit: userCanEditResource(resource),
    cells: columns.reduce<Record<string, TableCell>>((cells, column) => {
      cells[column.key] = cellFor(resource, column);
      return cells;
    }, {}),
  }));
}
