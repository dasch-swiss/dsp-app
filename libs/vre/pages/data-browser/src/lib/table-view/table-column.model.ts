import { Cardinality, Constants, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';

/** Synthetic key of the label column; the `__` prefix keeps it from colliding with a property IRI. */
export const LABEL_COLUMN_KEY = '__label';

export const IMAGE_COLUMN_KEY = '__image';

/** The fields of the Resource Rights Statement; license and copyright holder are the project's, authorship is the resource's. */
export type RightsField = 'license' | 'copyrightHolder' | 'authorship';

export const RIGHTS_COLUMN_KEYS: Readonly<Record<RightsField, string>> = {
  license: '__license',
  copyrightHolder: '__copyrightHolder',
  authorship: '__authorship',
};

/** Default widths in pixels per value type, leaving room for a hovered value's Edit/Move/Delete actions. */
const WIDTH_BY_VALUE_TYPE: ReadonlyMap<string, number> = new Map([
  [Constants.BooleanValue, 140],
  [Constants.ColorValue, 140],
  [Constants.DateValue, 200],
  [Constants.DecimalValue, 150],
  [Constants.GeonameValue, 220],
  [Constants.IntValue, 140],
  [Constants.IntervalValue, 200],
  [Constants.LinkValue, 240],
  [Constants.ListValue, 220],
  [Constants.TimeValue, 200],
  [Constants.UriValue, 260],
]);

export const DEFAULT_WIDTH = 240;

export const LABEL_COLUMN_WIDTH = 280;

/**
 * The label column's floor is higher than `MIN_COLUMN_WIDTH` because it also holds the row-control
 * gutter; under `table-layout: fixed` a cell cannot render below its non-shrinking content anyway.
 */
export const LABEL_MIN_COLUMN_WIDTH = 200;

/** Below this a header's own controls (grip, sort, filter, hide) no longer fit. */
export const MIN_COLUMN_WIDTH = 90;

/** Range of the View-options row-height slider, shown when the user picks Manual over Auto. */
export const ROW_HEIGHT_MIN = 48;
export const ROW_HEIGHT_MAX = 400;
export const ROW_HEIGHT_STEP = 8;
/** Where Manual starts the first time it is picked. */
export const ROW_HEIGHT_MANUAL_DEFAULT = 96;

/** One column of the table, built once per resource class from the ontology. */
export interface TableColumn {
  /** `LABEL_COLUMN_KEY` for the label, otherwise the property IRI. */
  readonly key: string;
  readonly propertyIri?: string;
  readonly label: string;
  readonly valueType: string;
  /** The ontology's definition, carried whole because the cell's template switcher reads `guiElement` and `guiAttributes` from it. */
  readonly propertyDefinition?: ResourcePropertyDefinitionWithAllLanguages;
  readonly cardinality?: Cardinality;
  /** The ontology's own ordering. */
  readonly guiOrder?: number;
  /**
   * Whether a cell of this column can host the resource editor. False where
   * `GenerateProperty.commonProperty` drops the property from `PropertyInfoValues`.
   */
  readonly isEditable: boolean;
  /** Whether the header offers a sort control; excludes link and list properties, as the Data tab does. */
  readonly isSortable: boolean;
  readonly isFilterable: boolean;
  readonly isImage?: boolean;
  readonly rightsField?: RightsField;
  /** Pinned to the left edge and excluded from hide, move and resize. Only the label column. */
  readonly isSticky: boolean;
  readonly defaultWidth: number;
  readonly minWidth: number;
}

/**
 * Minimum width while a value of the column is open in an editor; not persisted. 300 is the floor
 * for any editor in a Material form field.
 */
const EDIT_WIDTH_BY_VALUE_TYPE: ReadonlyMap<string, number> = new Map([
  [Constants.BooleanValue, 180],
  [Constants.DateValue, 340],
  [Constants.GeonameValue, 320],
  [Constants.IntervalValue, 320],
  [Constants.LinkValue, 320],
  [Constants.TextValue, 320],
  [Constants.UriValue, 320],
]);

export const DEFAULT_EDIT_WIDTH = 300;

export function editWidthForValueType(valueType: string): number {
  return EDIT_WIDTH_BY_VALUE_TYPE.get(valueType) ?? DEFAULT_EDIT_WIDTH;
}

export function defaultWidthForValueType(valueType: string): number {
  return WIDTH_BY_VALUE_TYPE.get(valueType) ?? DEFAULT_WIDTH;
}
