import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { ColumnResizeDirective } from './column-resize.directive';
import { DEFAULT_DENSITY, TableColumn, TableDensity } from './table-column.model';
import { buildRows, TableRow } from './table-row.model';

/**
 * A column with everything its header needs already resolved.
 *
 * Computed once per change to the inputs rather than looked up per binding: a class may carry forty
 * columns, and a header that asked a method for its icon, its label and its `aria-sort` would run
 * those three calls on every change-detection pass, forever.
 */
interface RenderColumn extends TableColumn {
  readonly width: number;
  /** `null` on every column but the sorted one — exactly one header may announce the sort. */
  readonly ariaSort: 'ascending' | 'descending' | null;
  readonly isSorted: boolean;
  readonly sortIcon: string;
  /** What the sort button would do next, which is also what its accessible name must say. */
  readonly nextSortDescending: boolean;
  readonly sortLabelKey: string;
  readonly isFiltered: boolean;
  readonly filterLabelKey: string;
}

/**
 * The Data tab's table view.
 *
 * Presentational on purpose: it takes the page's resources and a column model as inputs and knows
 * nothing about Gravsearch, paging or the URL. That is what lets the Advanced Search results page
 * adopt it later without a rewrite — the column model is an `@Input`, not a service dependency.
 *
 * Built on the **native** `<table mat-table>` rather than the flex `<mat-table>`. Flex tables
 * distribute width with `flex: 1` and cannot hold a reliable pixel width, which column resize
 * needs; `[fixedLayout]` additionally caches cell widths, which keeps sticky offsets cheap once a
 * class has forty columns.
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-scroll" [class]="densityClass()">
      <!-- The drop list is the table rather than the header row, and that is not a style choice:
           cdkDrag resolves its drop list through the injector of the view it was declared in, and
           the header cells are declared inside the column definitions below, which are children of
           the table and not of the row. On the row, every grip would come up with no drop list.
           The element container points back at the header row so the drop placeholder is inserted
           between the cells rather than appended to the table, where a stray th would be hoisted
           out of the table by the browser mid-drag. -->
      <table
        mat-table
        [dataSource]="rows()"
        [fixedLayout]="true"
        [trackBy]="trackRow"
        role="grid"
        [attr.aria-label]="'pages.dataBrowser.table.label' | translate"
        cdkDropList
        cdkDropListOrientation="horizontal"
        cdkDropListElementContainer="thead tr"
        [cdkDropListSortPredicate]="canDropAt"
        (cdkDropListDropped)="onColumnDropped($event)">
        <!-- Every column keeps its definition mounted; only the displayed-columns array changes.
             Dropping a def when its column is hidden makes MatTable re-register the remaining
             ones, and a displayed key with no surviving def throws. -->
        @for (column of renderColumns(); track column.key) {
          <ng-container [matColumnDef]="column.key" [sticky]="column.isSticky">
            <!-- Width on the header only: under table-layout fixed the first row fixes the column
                 widths, so binding it on every cell would be 25x the bindings for the same result.
                 MatTable emits role=columnheader but no scope, and no aria-sort unless matSort is
                 used — the Data tab's sort lives in the URL, so both are set here. The name is
                 given explicitly too: the grip and the resize handle sit inside the cell and carry
                 labels of their own, which would otherwise be read out as part of the column's
                 name. -->
            <th
              mat-header-cell
              *matHeaderCellDef
              scope="col"
              [style.width.px]="column.width"
              [attr.aria-label]="column.label"
              [attr.aria-sort]="column.ariaSort"
              cdkDrag
              [cdkDragDisabled]="column.isSticky">
              <div class="header-content">
                @if (!column.isSticky) {
                  <!-- The drag lives on a handle, not on the whole cell: a cell-wide drag would
                       turn every click on the sort and filter buttons below into a one-pixel
                       column move. -->
                  <button
                    type="button"
                    class="header-grip"
                    cdkDragHandle
                    data-cy="column-grip"
                    [attr.aria-label]="'pages.dataBrowser.table.moveColumn' | translate: { column: column.label }">
                    <mat-icon>drag_indicator</mat-icon>
                  </button>
                }
                <span class="header-label" [title]="column.label">{{ column.label }}</span>

                <!-- Only where the Data tab's own sort rule allows it (REQ-3.2). A control the
                     query cannot honour is worse than none: the user would click it and watch the
                     order not change. -->
                @if (column.isSortable) {
                  <button
                    type="button"
                    class="header-sort"
                    [class.is-active]="column.isSorted"
                    data-cy="column-sort"
                    [attr.aria-label]="column.sortLabelKey | translate: { column: column.label }"
                    (click)="sortToggled.emit({ key: column.key, descending: column.nextSortDescending })">
                    <mat-icon>{{ column.sortIcon }}</mat-icon>
                  </button>
                }

                @if (column.isFilterable) {
                  <button
                    type="button"
                    class="header-filter"
                    [class.is-active]="column.isFiltered"
                    data-cy="column-filter"
                    [attr.aria-label]="column.filterLabelKey | translate: { column: column.label }"
                    (click)="filterRequested.emit(column.key)">
                    <mat-icon>filter_list</mat-icon>
                  </button>
                }
              </div>

              @if (!column.isSticky) {
                <span
                  appColumnResize
                  data-cy="column-resize"
                  [minWidth]="column.minWidth"
                  [defaultWidth]="column.defaultWidth"
                  (widthChanged)="onColumnResized(column.key, $event)"
                  [attr.aria-label]="
                    'pages.dataBrowser.table.resizeColumn' | translate: { column: column.label }
                  "></span>
              }
            </th>

            <td mat-cell *matCellDef="let row" [class.is-label-cell]="column.isSticky">
              @let cell = row.cells[column.key];
              @if (cell.isEmpty) {
                <span class="cell-empty">{{ 'pages.dataBrowser.table.notSet' | translate }}</span>
              } @else {
                @let expanded = isExpanded(row.id, column.key);
                <div class="cell-values">
                  @for (value of expanded ? cell.values : cell.collapsedValues; track $index) {
                    <span class="cell-value">{{ value }}</span>
                  }
                  @if (cell.isCollapsible) {
                    <button
                      type="button"
                      class="cell-more"
                      data-cy="cell-more"
                      (click)="toggleExpanded(row.id, column.key); $event.stopPropagation()">
                      <mat-icon>{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                      @if (expanded) {
                        {{ 'pages.dataBrowser.table.showLess' | translate }}
                      } @else {
                        {{ 'pages.dataBrowser.table.showMore' | translate: { count: cell.hiddenCount } }}
                      }
                    </button>
                  }
                </div>
              }
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="visibleColumns(); sticky: true"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: visibleColumns()"
          [class.is-selected]="row.id === selectedResourceId()"
          (click)="resourceSelected.emit(row.resource)"></tr>
      </table>
    </div>
  `,
  styleUrl: './data-table.component.scss',
  imports: [MatTableModule, MatIcon, TranslatePipe, CdkDropList, CdkDrag, CdkDragHandle, ColumnResizeDirective],
})
export class DataTableComponent {
  /** The page's resources, already fetched in full. */
  readonly resources = input.required<ReadResource[]>();
  /** Every column of the class, visible or not. Drives the mounted column definitions. */
  readonly columns = input.required<TableColumn[]>();
  /** Keys of the columns to show, in display order. A subset of `columns`, label first. */
  readonly visibleColumns = input.required<string[]>();
  /** Pixel widths the user has set. A column absent here falls back to its `defaultWidth`. */
  readonly columnWidths = input<Readonly<Record<string, number>>>({});
  readonly density = input<TableDensity>(DEFAULT_DENSITY);
  /** IRI of the resource currently open in the viewer, highlighted in the table. */
  readonly selectedResourceId = input<string | undefined>(undefined);
  /** The sort the query is running, so the matching header can announce `aria-sort`. */
  readonly sortedColumnKey = input<string | undefined>(undefined);
  readonly sortDescending = input(false);
  /**
   * Keys of the columns a filter chip currently exists on.
   *
   * Derived from the shared filter state, not from anything the table did — so a chip removed in
   * the bar stops being indicated here with no further wiring (REQ-3.8).
   */
  readonly filteredColumnKeys = input<ReadonlySet<string>>(new Set<string>());

  readonly resourceSelected = output<ReadResource>();
  /** The whole new display order, not a delta — the host persists the array as it stands. */
  readonly columnsReordered = output<string[]>();
  readonly columnResized = output<{ key: string; width: number }>();
  /**
   * The sort the user just asked for, already resolved to a direction.
   *
   * The direction is decided here rather than by the host because the table is the only thing that
   * knows which header was clicked relative to the one currently sorted. Two-state by design
   * (REQ-3.1): a third "unsorted" step would have to mean *something* to Gravsearch, which always
   * orders by label when nothing else is asked for — so it would really be "sort by label", a state
   * the label column's own control already offers.
   */
  readonly sortToggled = output<{ key: string; descending: boolean }>();
  /** The column whose filter the user wants to edit. The host decides where the editor opens. */
  readonly filterRequested = output<string>();

  private readonly _table = viewChild(MatTable);

  readonly rows = computed<TableRow[]>(() => buildRows(this.resources(), this.columns()));

  protected readonly renderColumns = computed<RenderColumn[]>(() => {
    const widths = this.columnWidths();
    const sortedKey = this.sortedColumnKey();
    const descending = this.sortDescending();
    const filtered = this.filteredColumnKeys();

    return this.columns().map((column): RenderColumn => {
      const isSorted = column.key === sortedKey;
      // Clicking the column that is already sorted flips it; clicking any other starts ascending,
      // which is what "sort by this" means before the user has expressed a direction.
      const nextSortDescending = isSorted && !descending;
      const isFiltered = filtered.has(column.key);

      return {
        ...column,
        width: widths[column.key] ?? column.defaultWidth,
        ariaSort: isSorted ? (descending ? 'descending' : 'ascending') : null,
        isSorted,
        // `swap_vert` reads as "this can be sorted"; the arrows as "this is sorted, this way".
        sortIcon: isSorted ? (descending ? 'arrow_downward' : 'arrow_upward') : 'swap_vert',
        nextSortDescending,
        // The name states the outcome of the click, not the current state — a screen-reader user
        // gets the current state from `aria-sort` on the header and needs the button to say what
        // pressing it will do.
        sortLabelKey: nextSortDescending
          ? 'pages.dataBrowser.table.sortColumnDescending'
          : 'pages.dataBrowser.table.sortColumnAscending',
        isFiltered,
        filterLabelKey: isFiltered
          ? 'pages.dataBrowser.table.editColumnFilter'
          : 'pages.dataBrowser.table.filterByColumn',
      };
    });
  });

  protected readonly densityClass = computed(() => `density-${this.density()}`);

  /**
   * Which `(rowId, columnKey)` cells the user has expanded.
   *
   * Keyed by both, not stored on the row: rows are rebuilt on every data emission, and expansion
   * is a reading state the user set, not a property of the data. A space separator is safe — a
   * resource IRI cannot contain one.
   */
  private readonly _expanded = signal<ReadonlySet<string>>(new Set());

  protected isExpanded(rowId: string, columnKey: string): boolean {
    return this._expanded().has(`${rowId} ${columnKey}`);
  }

  protected toggleExpanded(rowId: string, columnKey: string): void {
    const key = `${rowId} ${columnKey}`;
    this._expanded.update(current => {
      const next = new Set(current);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  /**
   * Refuse a drop onto the first slot.
   *
   * The label column is drag-disabled, which stops it being *picked up* but says nothing about
   * another column being dropped in front of it. Without this the sticky column could end up at
   * index 1, pinned to the left edge with a scrolling column underneath it (REQ-2.10).
   */
  protected readonly canDropAt = (index: number) => index > 0;

  protected onColumnDropped(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // CDK reports indices in visual order, which for a header row is the displayed order — so this
    // is the array to move within, not the full column model.
    const order = [...this.visibleColumns()];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.columnsReordered.emit(order);
  }

  protected onColumnResized(key: string, width: number): void {
    this.columnResized.emit({ key, width });

    // Sticky offsets are derived from cached cell widths under `fixedLayout`, and MatTable only
    // invalidates that cache when the set of columns changes. A resize changes a width without
    // changing the set, so the label column would keep the offset of the old layout and the
    // columns next to it would slide under it.
    this._table()?.updateStickyColumnStyles();
  }

  /** Stable across re-queries, so a page change re-uses rows instead of rebuilding every cell. */
  protected readonly trackRow = (_: number, row: TableRow) => row.id;
}
