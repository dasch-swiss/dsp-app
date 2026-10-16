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

/**
 * Widths in pixels. Picked per value type so a date column does not open as wide as a text column.
 *
 * Each leaves room for the value's actions as well as the value: a hovered value carries Edit, Move
 * and Delete (3 × 28px) and one being edited Cancel and Save, on top of the cell's 20px of padding.
 * Sized for the value alone, an integer column left its editor some 30px and a date editor did not
 * fit at all (DEV-7494).
 */
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

/** Everything not in the table above — text, and any value type dsp-api grows later. */
export const DEFAULT_WIDTH = 240;

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
/**
 * The width a column is drawn at, at least, while one of its values is open in an editor: the
 * editor's field plus Cancel and Save. Below it the field was squeezed to a sliver and a date
 * editor overflowed its cell (DEV-7494). Not persisted — the column goes back to its own width once
 * the editor closes.
 *
 * 300 is the floor for any editor in a Material form field: the field's own 180px default width,
 * its padding, Cancel and Save, and the cell's padding come to just under it.
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

/** Every other value type: one form field. */
export const DEFAULT_EDIT_WIDTH = 300;

export function editWidthForValueType(valueType: string): number {
  return EDIT_WIDTH_BY_VALUE_TYPE.get(valueType) ?? DEFAULT_EDIT_WIDTH;
}

export function defaultWidthForValueType(valueType: string): number {
  return WIDTH_BY_VALUE_TYPE.get(valueType) ?? DEFAULT_WIDTH;
}
