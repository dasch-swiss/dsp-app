import { Injectable } from '@angular/core';
import {
  DEFAULT_DENSITY,
  DEFAULT_VISIBLE_COLUMN_COUNT,
  LABEL_COLUMN_KEY,
  TableColumn,
  TableDensity,
} from './table-column.model';

/** How a user has shaped one class's table. Column keys, not indices — the model can change under it. */
export interface TableLayout {
  /** Keys of the visible columns, in display order. Always starts with the label column. */
  readonly visible: string[];
  /** Keys of the hidden columns, in the order they would reappear in. */
  readonly hidden: string[];
  /** Pixel widths the user has set. A column absent here uses its `defaultWidth`. */
  readonly widths: Readonly<Record<string, number>>;
  readonly density: TableDensity;
}

/**
 * Bumped whenever the stored shape changes incompatibly.
 *
 * Cheaper than a migration: a layout is a convenience, not data, so an old entry is discarded rather
 * than upgraded. Without the version, a shape change would surface as a confusing half-restored
 * table rather than as a clean reset.
 */
const SCHEMA_VERSION = 1;

const KEY_PREFIX = `dsp.dataBrowser.tableLayout.v${SCHEMA_VERSION}.`;

const DENSITIES: readonly TableDensity[] = ['compact', 'default', 'comfortable'];

/** The stored form. Deliberately not `TableLayout` — anything read off disk is untrusted. */
interface StoredLayout {
  visible?: unknown;
  hidden?: unknown;
  widths?: unknown;
  density?: unknown;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

/**
 * Remembers how each resource class's table is laid out.
 *
 * Keyed by class IRI rather than by project: the columns *are* the class's properties, so a user's
 * `Postcard` layout has nothing to say about their `Person` layout.
 *
 * `localStorage` rather than the URL, unlike the rest of the Data tab's state. Which view you are
 * looking at is part of what you are showing someone and belongs in a shareable link; eight column
 * widths, an order array and a density are personal workspace config. Serialising them would produce
 * a URL nobody can read and turn every drag of a column border into a history entry.
 */
@Injectable({ providedIn: 'root' })
export class TableLayoutService {
  /**
   * The layout for a class, reconciled against the columns the class actually has today.
   *
   * Always returns something usable. An ontology changes under a stored layout — a property is
   * added, removed or renamed — and a stale entry must degrade to a sensible table rather than to a
   * column with no header or a missing one with no way back.
   */
  load(classIri: string, columns: TableColumn[]): TableLayout {
    const stored = this._read(classIri);
    return stored ? this._reconcile(stored, columns) : this.defaultLayout(columns);
  }

  save(classIri: string, layout: TableLayout): void {
    try {
      localStorage.setItem(this._key(classIri), JSON.stringify(layout));
    } catch {
      // Quota exceeded, or storage disabled by the browser. The table keeps working with the layout
      // it has in memory; only persistence is lost, and there is nothing useful to tell the user.
    }
  }

  clear(classIri: string): void {
    try {
      localStorage.removeItem(this._key(classIri));
    } catch {
      // See `save`.
    }
  }

  /** Label plus the first seven properties in `guiOrder`; the rest hidden (PRD REQ-2.1). */
  defaultLayout(columns: TableColumn[]): TableLayout {
    const keys = columns.map(column => column.key);
    return {
      visible: keys.slice(0, DEFAULT_VISIBLE_COLUMN_COUNT),
      hidden: keys.slice(DEFAULT_VISIBLE_COLUMN_COUNT),
      widths: {},
      density: DEFAULT_DENSITY,
    };
  }

  private _key(classIri: string): string {
    return `${KEY_PREFIX}${classIri}`;
  }

  private _read(classIri: string): StoredLayout | undefined {
    try {
      const raw = localStorage.getItem(this._key(classIri));
      if (!raw) {
        return undefined;
      }
      const parsed: unknown = JSON.parse(raw);
      // `JSON.parse('"x"')` and `JSON.parse('3')` both succeed. Anything that is not an object is
      // not a layout, and treating it as one would hand `_reconcile` a `.visible` of `undefined`.
      return typeof parsed === 'object' && parsed !== null ? (parsed as StoredLayout) : undefined;
    } catch {
      // Unparseable payload — hand-edited, truncated by a quota failure mid-write, or written by a
      // version that predates the schema prefix. Discard it and fall back (PRD REQ-2.9b).
      return undefined;
    }
  }

  /**
   * Intersect a stored layout with the class's current columns.
   *
   * Three cases, and all three are real rather than defensive: ontologies are edited while people
   * have the app open.
   *   - a stored key the class no longer defines is dropped (REQ-2.9);
   *   - a column the layout never heard of is added hidden, so a new property shows up in the picker
   *     instead of silently widening everyone's table (REQ-2.9a);
   *   - a malformed field falls back to its default rather than failing the whole layout.
   */
  private _reconcile(stored: StoredLayout, columns: TableColumn[]): TableLayout {
    const known = new Set(columns.map(column => column.key));
    const storedVisible = isStringArray(stored.visible) ? stored.visible : [];
    const storedHidden = isStringArray(stored.hidden) ? stored.hidden : [];

    const visible = storedVisible.filter(key => known.has(key));
    const hidden = storedHidden.filter(key => known.has(key));

    const accountedFor = new Set([...visible, ...hidden]);
    const unknownToLayout = columns.map(column => column.key).filter(key => !accountedFor.has(key));

    // The label column is structural, not a preference: `_reconcile` must not be able to produce a
    // table without it, however mangled the stored entry was.
    if (!visible.includes(LABEL_COLUMN_KEY)) {
      visible.unshift(LABEL_COLUMN_KEY);
    }

    return {
      visible,
      hidden: [...hidden, ...unknownToLayout].filter(key => key !== LABEL_COLUMN_KEY),
      widths: this._reconcileWidths(stored.widths, known),
      density: DENSITIES.includes(stored.density as TableDensity) ? (stored.density as TableDensity) : DEFAULT_DENSITY,
    };
  }

  private _reconcileWidths(widths: unknown, known: Set<string>): Record<string, number> {
    if (typeof widths !== 'object' || widths === null) {
      return {};
    }

    return Object.entries(widths as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
      // `Number.isFinite` rather than `typeof === 'number'`: `NaN` and `Infinity` both survive the
      // round trip as `null` or a number and would turn into a CSS width of `NaNpx`.
      if (known.has(key) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}
