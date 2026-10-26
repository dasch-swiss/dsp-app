import { computed, inject, Injectable, signal } from '@angular/core';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';
import { arrangePinned, TableLayout, TableLayoutService } from './table-layout.service';

const EMPTY_LAYOUT: TableLayout = { visible: [], hidden: [], widths: {} };

export interface ColumnPickerEntry {
  readonly column: TableColumn;
  readonly isVisible: boolean;
}

/**
 * The shaping the user has applied to the table. A service because the View options menu and the
 * table share no parent that should know about columns. Every mutation writes through to
 * {@link TableLayoutService} immediately, since there is no Apply button.
 */
@Injectable({ providedIn: 'root' })
export class TableViewStateService {
  private readonly _layoutStore = inject(TableLayoutService);

  /** Set by `init`; until then writes are not persisted. */
  private _classIri?: string;

  readonly columns = signal<TableColumn[]>([]);
  readonly layout = signal<TableLayout>(EMPTY_LAYOUT);

  /** In model order, not display order, so ticking a box does not move the next one. */
  readonly pickerEntries = computed<ColumnPickerEntry[]>(() => {
    const visible = new Set(this.layout().visible);
    return this.columns().map(column => ({ column, isVisible: visible.has(column.key) }));
  });

  init(classIri: string, columns: TableColumn[]): void {
    this._classIri = classIri;
    this.columns.set(columns);
    this.layout.set(this._layoutStore.load(classIri, columns));
  }

  /** `undefined` is Auto and removes the field. */
  setRowHeight(rowHeight: number | undefined): void {
    this._update(layout => {
      const { rowHeight: _previous, ...rest } = layout;
      return rowHeight === undefined ? rest : { ...rest, rowHeight };
    });
  }

  /**
   * Show or hide one column. A shown column is appended at the right-hand end; a hidden one goes
   * back into `hidden` in model order.
   */
  setColumnVisible(key: string, isVisible: boolean): void {
    // The label column is never hidden; guarded here too because a stored layout could ask for it.
    if (key === LABEL_COLUMN_KEY) {
      return;
    }

    this._update(layout => {
      if (isVisible) {
        return {
          ...layout,
          visible: layout.visible.includes(key) ? layout.visible : [...layout.visible, key],
          hidden: layout.hidden.filter(entry => entry !== key),
        };
      }

      return this._withPinned(
        {
          ...layout,
          visible: layout.visible.filter(entry => entry !== key),
          hidden: this._insertInModelOrder(layout.hidden, key),
        },
        (layout.pinned ?? []).filter(entry => entry !== key)
      );
    });
  }

  /** Accepts the whole new display order (as `moveItemInArray` produces) and re-asserts the pinned group first. */
  setVisibleOrder(visible: string[]): void {
    this._update(layout => {
      const pinned = layout.pinned ?? [];
      return this._withPinned(
        { ...layout, visible },
        visible.filter(key => pinned.includes(key))
      );
    });
  }

  /**
   * Pin a column after the label (joining the end of the pins), or unpin it back to where it was.
   * If its former neighbour has since been hidden or pinned, it goes after the nearest preceding
   * model column that still scrolls.
   */
  togglePinned(key: string): void {
    if (key === LABEL_COLUMN_KEY) {
      return;
    }

    this._update(layout => {
      const pinned = layout.pinned ?? [];
      if (pinned.includes(key)) {
        const remaining = pinned.filter(entry => entry !== key);
        const scrolling = layout.visible.filter(
          entry => entry !== LABEL_COLUMN_KEY && entry !== key && !remaining.includes(entry)
        );
        scrolling.splice(this._unpinnedIndex(key, layout.pinnedAfter?.[key], scrolling), 0, key);
        return this._withPinned({ ...layout, visible: [LABEL_COLUMN_KEY, ...remaining, ...scrolling] }, remaining);
      }

      if (!layout.visible.includes(key)) {
        return layout;
      }
      const scrolling = layout.visible.filter(entry => entry !== LABEL_COLUMN_KEY && !pinned.includes(entry));
      const index = scrolling.indexOf(key);
      const pinnedAfter = { ...layout.pinnedAfter, [key]: index > 0 ? scrolling[index - 1] : null };
      return this._withPinned({ ...layout, pinnedAfter }, [...pinned, key]);
    });
  }

  private _unpinnedIndex(key: string, after: string | null | undefined, scrolling: string[]): number {
    if (after === null) {
      return 0;
    }
    if (after !== undefined && scrolling.includes(after)) {
      return scrolling.indexOf(after) + 1;
    }
    const order = this.columns().map(column => column.key);
    const before = order
      .slice(0, order.indexOf(key))
      .reverse()
      .find(previous => scrolling.includes(previous));
    return before === undefined ? 0 : scrolling.indexOf(before) + 1;
  }

  setColumnWidth(key: string, width: number): void {
    this._update(layout => ({ ...layout, widths: { ...layout.widths, [key]: width } }));
  }

  /** Forget a user-set width; the entry is deleted, not overwritten, so retuned defaults apply. */
  resetColumnWidth(key: string): void {
    this._update(layout => {
      const widths = { ...layout.widths };
      delete widths[key];
      return { ...layout, widths };
    });
  }

  /**
   * Show or hide every column at once. The sticky label column is exempt, and showing all appends
   * the hidden columns so a user's drag order is kept.
   */
  setAllColumnsVisible(isVisible: boolean): void {
    const order = this.columns().map(column => column.key);
    const hideable = this.columns().filter(column => !column.isSticky);

    this._update(layout => {
      if (isVisible) {
        const appended = layout.hidden.filter(key => order.includes(key));
        return { ...layout, visible: [...layout.visible, ...appended], hidden: [] };
      }

      return this._withPinned(
        {
          ...layout,
          visible: layout.visible.filter(key => !hideable.some(column => column.key === key)),
          hidden: hideable.map(column => column.key),
        },
        []
      );
    });
  }

  /** Set the pins and re-arrange `visible` around them; no pins removes both fields. */
  private _withPinned(layout: TableLayout, pinned: string[]): TableLayout {
    const { pinned: _previous, pinnedAfter: previousAfter, ...rest } = layout;
    const visible = arrangePinned(layout.visible, pinned);
    const pinnedAfter = Object.fromEntries(Object.entries(previousAfter ?? {}).filter(([key]) => pinned.includes(key)));
    return {
      ...rest,
      visible,
      ...(pinned.length > 0 ? { pinned } : {}),
      ...(Object.keys(pinnedAfter).length > 0 ? { pinnedAfter } : {}),
    };
  }

  private _insertInModelOrder(keys: string[], key: string): string[] {
    const order = this.columns().map(column => column.key);
    const next = [...keys, key];
    return next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }

  private _update(change: (layout: TableLayout) => TableLayout): void {
    const next = change(this.layout());
    this.layout.set(next);

    if (this._classIri) {
      this._layoutStore.save(this._classIri, next);
    }
  }
}
