import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { computed } from '@angular/core';
import { rememberedSignal } from './remembered-signal';

/** How a table's columns start: in this order, at these widths, none narrower than the minimum. */
export interface TableColumnsConfig<C extends string> {
  /** Where the viewer's order, hidden columns and widths are remembered; `-columns` and `-widths` are added. */
  storageKey: string;
  /** Every column in its first order; the first stays first and cannot be hidden. */
  columns: readonly C[];
  defaultWidths: Record<C, number>;
  /** Below these, a header's name and filter button no longer fit. */
  minWidths: Record<C, number>;
}

/**
 * A table's columns as the viewer arranges them: the order they dragged them to, those they hid and the widths they
 * gave them, each remembered in this browser. The first column is the row's name: it stays first and shown.
 */
export class TableColumns<C extends string> {
  /** The viewer's order of the columns after the first, and the columns they hid. */
  private readonly _arranged;
  /** The widths the viewer dragged the columns to. */
  readonly widths;

  /** Every column, in the viewer's order; a column added since joins at the end. */
  readonly order = computed((): C[] => {
    const [first, ...rest] = this.config.columns;
    const order = this._arranged().order;
    return [first, ...order, ...rest.filter(column => !order.includes(column))];
  });
  readonly hidden = computed(() => this._arranged().hidden);
  /** The columns shown, in their order. */
  readonly shown = computed(() => this.order().filter(column => !this.hidden().includes(column)));
  readonly allShown = computed(() => this.hidden().length === 0);
  /** A fixed layout needs the table's own width: the sum of its shown columns. */
  readonly tableWidth = computed(() => this.shown().reduce((sum, column) => sum + this.widthOf(column), 0));

  constructor(readonly config: TableColumnsConfig<C>) {
    const movable = config.columns.slice(1);
    // Each column once, the first never: it stays first.
    const known = (keys: unknown): C[] =>
      Array.isArray(keys) ? [...new Set(keys.filter((key): key is C => movable.includes(key as C)))] : [];
    this._arranged = rememberedSignal<{ order: C[]; hidden: C[] }>(
      `${config.storageKey}-columns`,
      { order: [], hidden: [] },
      stored => {
        const { order, hidden } = JSON.parse(stored);
        return { order: known(order), hidden: known(hidden) };
      }
    );
    this.widths = rememberedSignal<Partial<Record<C, number>>>(`${config.storageKey}-widths`, {}, JSON.parse);
  }

  widthOf(column: C): number {
    return this.widths()[column] ?? this.config.defaultWidths[column];
  }

  /** Stores a column's dragged width, or forgets it to go back to the default. */
  resize(column: C, width: number | undefined): void {
    const next = { ...this.widths(), [column]: width };
    if (width === undefined) delete next[column];
    this.widths.set(next);
  }

  show(column: C, shown: boolean): void {
    const hidden = this.hidden().filter(other => other !== column);
    this._arranged.set({ ...this._arranged(), hidden: shown ? hidden : [...hidden, column] });
  }

  /** Shows every column, or hides all but the first. */
  showAll(shown: boolean): void {
    this._arranged.set({ ...this._arranged(), hidden: shown ? [] : this.config.columns.slice(1) });
  }

  /** Any place but the first, which is the row name's. */
  readonly canDropAt = (index: number): boolean => index > 0;

  /** A header dropped elsewhere; the hidden columns keep their place among the others. */
  drop(event: Pick<CdkDragDrop<unknown>, 'previousIndex' | 'currentIndex'>): void {
    // The first column neither moves nor gives up its place.
    if (event.previousIndex === event.currentIndex || event.previousIndex < 1 || event.currentIndex < 1) return;
    // CDK counts the shown header cells.
    const shown = [...this.shown()];
    moveItemInArray(shown, event.previousIndex, event.currentIndex);
    const order = [...this.order()];
    const slots = order.flatMap((column, index) => (this.hidden().includes(column) ? [] : [index]));
    slots.forEach((slot, i) => (order[slot] = shown[i]));
    this._arranged.set({ ...this._arranged(), order: order.filter(column => column !== this.config.columns[0]) });
  }
}
