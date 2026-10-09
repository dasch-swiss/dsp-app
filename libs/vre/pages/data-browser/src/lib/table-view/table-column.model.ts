import { Cardinality, Constants, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';

/**
 * The synthetic key of the resource-label column.
 *
 * Not a property IRI, because the label is not a property: it lives on the resource itself. It still
 * needs a key, because the column model, the layout store and `displayedColumns` all address columns
 * by string. A `__` prefix keeps it from ever colliding with an IRI.
 */
export const LABEL_COLUMN_KEY = '__label';

/** Synthetic key of the image column, which classes of still-image resources get after the label. */
export const IMAGE_COLUMN_KEY = '__image';

/**
 * The three fields of the Resource Rights Statement, as the viewer shows it under a resource's
 * properties. License and copyright holder are the project's, so they read the same on every row;
 * authorship is the resource's own, falling back to the project's default.
 */
export type RightsField = 'license' | 'copyrightHolder' | 'authorship';

/** Synthetic keys like the label column's: the rights statement is not made of properties. */
export const RIGHTS_COLUMN_KEYS: Readonly<Record<RightsField, string>> = {
  license: '__license',
  copyrightHolder: '__copyrightHolder',
  authorship: '__authorship',
};

/** Widths in pixels. Picked per value type so a date column does not open as wide as a text column. */
const WIDTH_BY_VALUE_TYPE: ReadonlyMap<string, number> = new Map([
  [Constants.BooleanValue, 110],
  [Constants.ColorValue, 110],
  [Constants.DateValue, 150],
  [Constants.DecimalValue, 120],
  [Constants.GeonameValue, 180],
  [Constants.IntValue, 110],
  [Constants.IntervalValue, 150],
  [Constants.LinkValue, 200],
  [Constants.ListValue, 180],
  [Constants.TimeValue, 150],
  [Constants.UriValue, 220],
]);

/** Everything not in the table above — text, and any value type dsp-api grows later. */
export const DEFAULT_WIDTH = 200;

/** The label carries the resource's identity, so it opens wider than a generic text column. */
export const LABEL_COLUMN_WIDTH = 280;

/**
 * The label column cannot shrink as far as the others.
 *
 * `MIN_COLUMN_WIDTH` leaves room for a header's own controls; the label column additionally
 * carries the row-control gutter inside it, so the same floor would let the user drag the label
 * out from under its own checkbox and open arrow.
 *
 * 200 rather than a tighter number because that is where the browser stops anyway: under
 * `table-layout: fixed` a cell still cannot go below the width of content that will not shrink,
 * and the 104px gutter plus the header's own controls add up to about this. A smaller constant
 * would be stored and honoured as an inline width while the cell rendered wider regardless —
 * a declared minimum nobody could ever reach.
 */
export const LABEL_MIN_COLUMN_WIDTH = 200;

/**
 * Below this a header's own controls — grip, sort, filter, hide — no longer fit, so the column stops
 * being operable rather than merely narrow.
 */
export const MIN_COLUMN_WIDTH = 90;

/**
 * The range of the View-options row-height slider, shown once the user picks Manual over Auto —
 * where rows hug their content, however tall, which is how the table behaves until asked otherwise.
 */
export const ROW_HEIGHT_MIN = 48;
export const ROW_HEIGHT_MAX = 400;
export const ROW_HEIGHT_STEP = 8;
/** Where Manual starts the first time it is picked: two lines of text, or a legible thumbnail. */
export const ROW_HEIGHT_MANUAL_DEFAULT = 96;

/**
 * One column of the table.
 *
 * Built once per resource class from the ontology, then held constant while the user shapes which of
 * them are visible and how wide. Everything the header and the cells need to decide how to render is
 * resolved here rather than re-derived per row — at 25 rows a per-cell lookup is 25 lookups.
 */
export interface TableColumn {
  /** `LABEL_COLUMN_KEY` for the label, otherwise the property IRI. Addresses the column everywhere. */
  readonly key: string;
  /** Absent on the label column, which has no property behind it. */
  readonly propertyIri?: string;
  /** Already localised — the model is rebuilt when the UI language changes. */
  readonly label: string;
  /** The dsp-api value type, e.g. `Constants.TextValue`. Empty on the label column. */
  readonly valueType: string;
  /**
   * The ontology's own definition of the property. Absent on the label column.
   *
   * Carried whole rather than reduced to the handful of fields the table itself reads, because a
   * cell renders its values through the resource viewer's template switcher and that switcher
   * takes the definition — it reads `guiElement` to choose between the three text renderings and
   * `guiAttributes` to find a list's root node. Narrowing it here would mean rebuilding it there.
   */
  readonly propertyDefinition?: ResourcePropertyDefinitionWithAllLanguages;
  /** How many values a resource may carry for this property. Drives the multi-value cell. */
  readonly cardinality?: Cardinality;
  /** The ontology's own ordering. Ties are broken by the order the class lists its properties in. */
  readonly guiOrder?: number;
  /**
   * Whether a cell of this column can host the resource editor.
   *
   * False for link, file-value and geometry properties, and for anything not `isEditable`:
   * `GenerateProperty.commonProperty` drops exactly those from `PropertyInfoValues`, so there is no
   * editor component to mount. Those columns render read-only (PRD §9.11).
   */
  readonly isEditable: boolean;
  /**
   * Whether the header offers a sort control.
   *
   * Narrower than `isEditable`: the Data tab's existing rule excludes link properties and list
   * values, because ordering by a URI or by a reference to another resource is not meaningful. The
   * table does not widen it (PRD §9.12).
   */
  readonly isSortable: boolean;
  /** Whether the header offers a filter control. Mirrors what the shared filter bar can express. */
  readonly isFilterable: boolean;
  /** True on the image column, which shows each resource's still image as a thumbnail. */
  readonly isImage?: boolean;
  /** Which rights-statement field the column shows. Absent on every other column. */
  readonly rightsField?: RightsField;
  /** Pinned to the left edge and excluded from hide, move and resize. Only the label column. */
  readonly isSticky: boolean;
  readonly defaultWidth: number;
  readonly minWidth: number;
}

/** The width a column opens at, before the user has resized it. */
export function defaultWidthForValueType(valueType: string): number {
  return WIDTH_BY_VALUE_TYPE.get(valueType) ?? DEFAULT_WIDTH;
}
