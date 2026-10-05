import { computed, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_DENSITY, LABEL_COLUMN_KEY, TableColumn, TableDensity } from './table-column.model';
import { TableLayout, TableLayoutService } from './table-layout.service';

const EMPTY_LAYOUT: TableLayout = { visible: [], hidden: [], widths: {}, density: DEFAULT_DENSITY };

/** One row of the column picker: the column, and whether it is currently drawn. */
export interface ColumnPickerEntry {
  readonly column: TableColumn;
  readonly isVisible: boolean;
}

/**
 * The shaping the user has applied to the table they are looking at.
 *
 * A service rather than state on a component because the two surfaces that touch it are not in a
 * parent/child relationship: the View options menu sits in the class header *above* the split, and
 * the table it shapes sits in the result panel *below* it. Their nearest common ancestor is the
 * class view, which knows nothing about columns — threading inputs and outputs through it would put
 * the whole column model in a component that has no use for it.
 *
 * Scoped by nothing but the class IRI it was last initialised with. Only one class view is mounted
 * at a time, and `init` replaces the state wholesale, so a per-view provider would buy nothing.
 *
 * Every mutation writes through to {@link TableLayoutService} immediately rather than on some
 * explicit save. There is no Apply button in the menu — the table reshapes as you click — so an
 * unpersisted intermediate state would be a state the user can see but not get back.
 */
@Injectable({ providedIn: 'root' })
export class TableViewStateService {
  private readonly _layoutStore = inject(TableLayoutService);

  /** Set by `init`. Until then there is nothing to persist against and writes are dropped. */
  private _classIri?: string;

  /** Every column of the class, visible or not, in model order. */
  readonly columns = signal<TableColumn[]>([]);
  readonly layout = signal<TableLayout>(EMPTY_LAYOUT);

  /**
   * The picker's rows, in model order rather than in display order.
   *
   * Reordering the list under the user as they tick boxes would make the next box they aimed at
   * move out from under the cursor, so the picker stays in the ontology's order while the table
   * follows the user's.
   */
  readonly pickerEntries = computed<ColumnPickerEntry[]>(() => {
    const visible = new Set(this.layout().visible);
    return this.columns().map(column => ({ column, isVisible: visible.has(column.key) }));
  });

  /** Load a class's columns and whatever layout the user last left them in. */
  init(classIri: string, columns: TableColumn[]): void {
    this._classIri = classIri;
    this.columns.set(columns);
    this.layout.set(this._layoutStore.load(classIri, columns));
  }

  setDensity(density: TableDensity): void {
    this._update(layout => ({ ...layout, density }));
  }

  /**
   * Show or hide one column.
   *
   * A shown column is appended rather than slotted back into its model position: after a reorder
   * the display order no longer resembles the model's, so there is no position to restore it to
   * that would not look arbitrary. Appending puts it where the user is told to look for it — at the
   * right-hand end — and a drag moves it from there.
   *
   * A hidden column, by contrast, goes back into `hidden` in model order, because that list is only
   * ever read as the picker's own ordering.
   */
  setColumnVisible(key: string, isVisible: boolean): void {
    // The label column carries the row's identity while the rest of the table scrolls horizontally
    // past it, so hiding it is not offered (REQ-2.10). Guarded here as well as in the picker: a
    // stored layout written by an older build could still ask for it.
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

      return {
        ...layout,
        visible: layout.visible.filter(entry => entry !== key),
        hidden: this._insertInModelOrder(layout.hidden, key),
      };
    });
  }

  /** Accepts the whole new display order, which is what `moveItemInArray` produces on a drop. */
  setVisibleOrder(visible: string[]): void {
    this._update(layout => ({ ...layout, visible }));
  }

  setColumnWidth(key: string, width: number): void {
    this._update(layout => ({ ...layout, widths: { ...layout.widths, [key]: width } }));
  }

  /**
   * Forget a user-set width, so the column falls back to the default for its value type.
   *
   * Deleting the entry rather than writing the default in: the defaults are a lookup table that may
   * be retuned, and a stored copy of today's number would pin the column to it forever.
   */
  resetColumnWidth(key: string): void {
    this._update(layout => {
      const widths = { ...layout.widths };
      delete widths[key];
      return { ...layout, widths };
    });
  }

  /**
   * Show or hide every column at once.
   *
   * A class with forty properties is the reason this exists: reaching a working table from the
   * default eight means ticking thirty-two rows, and getting back means ticking them again. The
   * sticky label column is exempt in both directions, so "hide all" leaves a table of labels
   * rather than a table of nothing (REQ-2.10).
   *
   * Showing all appends the hidden columns in model order rather than rebuilding the whole list,
   * so a user who has already dragged their visible columns into an order keeps it.
   */
  setAllColumnsVisible(isVisible: boolean): void {
    const order = this.columns().map(column => column.key);
    const hideable = this.columns().filter(column => !column.isSticky);

    this._update(layout => {
      if (isVisible) {
        const appended = layout.hidden.filter(key => order.includes(key));
        return { ...layout, visible: [...layout.visible, ...appended], hidden: [] };
      }

      return {
        ...layout,
        visible: layout.visible.filter(key => !hideable.some(column => column.key === key)),
        hidden: hideable.map(column => column.key),
      };
    });
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
