import { Injectable } from '@angular/core';
import { LABEL_COLUMN_KEY, ROW_HEIGHT_MAX, ROW_HEIGHT_MIN, TableColumn } from './table-column.model';

/** How a user has shaped one class's table. Keyed by column key, since the model can change under it. */
export interface TableLayout {
  /** Keys of the visible columns, in display order. Always starts with the label column. */
  readonly visible: string[];
  readonly hidden: string[];
  /** Pixel widths the user has set; an absent column uses its `defaultWidth`. */
  readonly widths: Readonly<Record<string, number>>;
  /** The height every row is set to by the slider; absent means Auto. Persisted per class, unlike a dragged row height. */
  readonly rowHeight?: number;
  /** Keys of the columns pinned after the label. Always a prefix of `visible` after the label. */
  readonly pinned?: string[];
  /** For each pinned column, the scrolling column it followed (`null` if first), so unpinning restores its place. */
  readonly pinnedAfter?: Readonly<Record<string, string | null>>;
}

/** Arrange `visible` as the label, then the pinned columns, then the rest. */
export function arrangePinned(visible: readonly string[], pinned: readonly string[]): string[] {
  const rest = visible.filter(key => key !== LABEL_COLUMN_KEY && !pinned.includes(key));
  return [...(visible.includes(LABEL_COLUMN_KEY) ? [LABEL_COLUMN_KEY] : []), ...pinned, ...rest];
}

/** Bumped whenever the stored shape changes incompatibly; an old entry is then discarded rather than migrated. */
const SCHEMA_VERSION = 2;

const KEY_PREFIX = `dsp.dataBrowser.tableLayout.v${SCHEMA_VERSION}.`;

/** The stored form; not `TableLayout`, because anything read off disk is untrusted. */
interface StoredLayout {
  visible?: unknown;
  hidden?: unknown;
  widths?: unknown;
  rowHeight?: unknown;
  pinned?: unknown;
  pinnedAfter?: unknown;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

/**
 * Remembers how each resource class's table is laid out, keyed by class IRI. Stored in
 * `localStorage`, not the URL, because it is personal workspace config.
 */
@Injectable({ providedIn: 'root' })
export class TableLayoutService {
  /** The layout for a class, reconciled against the columns the class has today; a stale entry degrades to a sensible table. */
  load(classIri: string, columns: TableColumn[]): TableLayout {
    const stored = this._read(classIri);
    return stored ? this._reconcile(stored, columns) : this.defaultLayout(columns);
  }

  save(classIri: string, layout: TableLayout): void {
    try {
      localStorage.setItem(this._key(classIri), JSON.stringify(layout));
    } catch {
      // Quota exceeded or storage disabled: the in-memory layout keeps working.
    }
  }

  clear(classIri: string): void {
    try {
      localStorage.removeItem(this._key(classIri));
    } catch {
      // See `save`.
    }
  }

  /** Every column, in `guiOrder`, nothing hidden. */
  defaultLayout(columns: TableColumn[]): TableLayout {
    return {
      visible: columns.map(column => column.key),
      hidden: [],
      widths: {},
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
      // `JSON.parse` also accepts scalars, which are not a layout.
      return typeof parsed === 'object' && parsed !== null ? (parsed as StoredLayout) : undefined;
    } catch {
      // Unparseable payload: discard it.
      return undefined;
    }
  }

  /**
   * Intersect a stored layout with the class's current columns: stored keys the class no longer
   * defines are dropped, new columns are added visible at their model position, and a malformed
   * field falls back to its default.
   */
  private _reconcile(stored: StoredLayout, columns: TableColumn[]): TableLayout {
    const known = new Set(columns.map(column => column.key));
    const storedVisible = isStringArray(stored.visible) ? stored.visible : [];
    const storedHidden = isStringArray(stored.hidden) ? stored.hidden : [];

    const visible = storedVisible.filter(key => known.has(key));
    const hidden = storedHidden.filter(key => known.has(key));

    const accountedFor = new Set([...visible, ...hidden]);
    const unknownToLayout = columns.map(column => column.key).filter(key => !accountedFor.has(key));

    // `_reconcile` must never produce a table without the label column.
    if (!visible.includes(LABEL_COLUMN_KEY)) {
      visible.unshift(LABEL_COLUMN_KEY);
    }

    const allVisible = this._insertInModelPosition(
      visible,
      unknownToLayout.filter(key => key !== LABEL_COLUMN_KEY),
      columns
    );
    const pinned = (isStringArray(stored.pinned) ? stored.pinned : []).filter(
      key => key !== LABEL_COLUMN_KEY && allVisible.includes(key)
    );

    return {
      visible: arrangePinned(allVisible, pinned),
      hidden: hidden.filter(key => key !== LABEL_COLUMN_KEY),
      widths: this._reconcileWidths(stored.widths, known),
      ...this._reconcileRowHeight(stored.rowHeight),
      ...(pinned.length > 0 ? { pinned } : {}),
      ...this._reconcilePinnedAfter(stored.pinnedAfter, pinned, known),
    };
  }

  /** Only entries for columns still pinned, pointing at a column the class still has, or `null`. */
  private _reconcilePinnedAfter(
    pinnedAfter: unknown,
    pinned: string[],
    known: Set<string>
  ): { pinnedAfter?: Record<string, string | null> } {
    if (typeof pinnedAfter !== 'object' || pinnedAfter === null || Array.isArray(pinnedAfter)) {
      return {};
    }
    const entries = Object.entries(pinnedAfter).filter(
      ([key, after]) => pinned.includes(key) && (after === null || (typeof after === 'string' && known.has(after)))
    );
    return entries.length > 0 ? { pinnedAfter: Object.fromEntries(entries) as Record<string, string | null> } : {};
  }

  /** Insert each new key after the nearest preceding model column that is already shown. */
  private _insertInModelPosition(visible: string[], added: string[], columns: TableColumn[]): string[] {
    const order = columns.map(column => column.key);
    const result = [...visible];

    for (const key of added) {
      const before = order
        .slice(0, order.indexOf(key))
        .reverse()
        .find(previous => result.includes(previous));
      result.splice(before === undefined ? result.length : result.indexOf(before) + 1, 0, key);
    }
    return result;
  }

  /** A stored row height survives only if the slider could have produced it; otherwise Auto. */
  private _reconcileRowHeight(rowHeight: unknown): { rowHeight?: number } {
    return typeof rowHeight === 'number' &&
      Number.isFinite(rowHeight) &&
      rowHeight >= ROW_HEIGHT_MIN &&
      rowHeight <= ROW_HEIGHT_MAX
      ? { rowHeight }
      : {};
  }

  private _reconcileWidths(widths: unknown, known: Set<string>): Record<string, number> {
    if (typeof widths !== 'object' || widths === null) {
      return {};
    }

    return Object.entries(widths as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
      // `NaN` and `Infinity` would become a CSS width of `NaNpx`.
      if (known.has(key) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}
