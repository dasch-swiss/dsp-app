import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { ReadResource } from '@dasch-swiss/dsp-js';
import {
  FootnoteService,
  PropertiesDisplayService,
  ResourceExplorerButtonComponent,
} from '@dasch-swiss/vre/resource-editor/resource-editor';
import { TranslatePipe } from '@ngx-translate/core';
import { ColumnResizeDirective } from './column-resize.directive';
import { RowResizeDirective } from './row-resize.directive';
import { ScrollWhenTallerDirective } from './scroll-when-taller.directive';
import { TableColumn } from './table-column.model';
import { TablePropertyCellComponent } from './table-property-cell.component';
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
 * The trailing column that absorbs the table's spare width.
 *
 * `__` like the label column's key, so it can never collide with a property IRI.
 */
const FILLER_COLUMN_KEY = '__filler';

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
    <div class="table-scroll" [class.selection-active]="selectionActive()">
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
              [class.is-label-header]="column.isSticky"
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
                    [attr.aria-label]="'pages.dataBrowser.table.moveColumn' | translate: { column: column.label }"
                    [attr.aria-keyshortcuts]="'ArrowLeft ArrowRight'"
                    (keydown)="onGripKeydown(column.key, $event)">
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

              <!-- The label column resizes too. It is pinned and immovable because the row's
                   identity has to stay put while the rest scrolls past, but how wide that
                   identity needs to be is the user's business — and labels vary more in length
                   than anything else in the table. Its own minimum is larger than the others'
                   because the control gutter lives inside it. -->
              <span
                appColumnResize
                data-cy="column-resize"
                [minWidth]="column.minWidth"
                [defaultWidth]="column.defaultWidth"
                [width]="column.width"
                (widthChanged)="onColumnResized(column.key, $event)"
                [attr.aria-label]="'pages.dataBrowser.table.resizeColumn' | translate: { column: column.label }"></span>
            </th>

            <td mat-cell *matCellDef="let row" [class.is-label-cell]="column.isSticky">
              <!-- The row's own controls ride in the sticky label cell rather than in two columns
                   of their own, as the design draws them. Two extra columns would be two more
                   sticky offsets to recompute on every resize and two more keys to reconcile in
                   the persisted layout — for columns the user can neither hide, move nor resize.
                   They are positioned absolutely, so the cell keeps its table-cell display and the
                   generic cell rendering below is untouched; the header's label is indented by the
                   same amount so the two line up. -->
              @if (column.isSticky) {
                <!-- The row's own resize handle, in the one cell that is always on screen however
                     far the table is scrolled sideways. -->
                <span
                  appRowResize
                  data-cy="row-resize"
                  [minHeight]="rowMinHeight"
                  [height]="rowHeightFor(row.id) ?? 0"
                  (heightChanged)="onRowResized(row.id, $event)"
                  (heightReset)="onRowHeightReset(row.id)"
                  [attr.aria-label]="'pages.dataBrowser.table.resizeRow' | translate: { label: row.label }"></span>
                <div class="row-controls" (click)="$event.stopPropagation()">
                  <mat-checkbox
                    data-cy="row-check"
                    [checked]="checkedResourceIds().has(row.id)"
                    [attr.aria-label]="'pages.dataBrowser.table.selectRow' | translate: { label: row.label }"
                    (change)="onRowCheckChanged(row.resource, $event)" />
                  <!-- The app's own drawer-dialog control, not a bespoke one. Opening a resource
                       from a table row should land the user in the same place as opening it from
                       a property or a link elsewhere; a second presentation of the same resource
                       would be a second thing to keep in step. -->
                  <app-resource-explorer-button
                    class="row-open"
                    data-cy="row-open"
                    [resourceIri]="row.id"
                    [ariaLabel]="'pages.dataBrowser.table.openRow' | translate: { label: row.label }" />
                </div>
              }

              @let cell = row.cells[column.key];
              @if (cell.isEmpty && !cell.propertyInfo) {
                <!-- Read-only cells only. A cell that mounts the viewer unit already says it is
                     empty the way the viewer says it — an add control and nothing above it — and
                     stacking a label on top of that is both a second answer to the same question
                     and a second line in every empty row. -->
                <span class="cell-empty">{{ 'pages.dataBrowser.table.notSet' | translate }}</span>
              }

              @if (cell.text !== undefined) {
                <!-- The label column. Kept inside the same wrapper as a property cell so the two
                     line up: cell-value only truncates as a flex item. -->
                <div class="cell-values" [appScrollWhenTaller]="rowCap(row.id)">
                  <span class="cell-value">{{ cell.text }}</span>
                </div>
              } @else if (cell.propertyInfo; as propertyInfo) {
                <!-- Every click inside the cell is also a click on the row, which selects the
                     resource in the viewer. Stopped once here rather than on each of the dozen
                     controls the viewer's unit brings with it. -->
                <div class="cell-property" [appScrollWhenTaller]="rowCap(row.id)" (click)="$event.stopPropagation()">
                  <app-table-property-cell
                    [dspResource]="row.dspResource!"
                    [myProperty]="propertyInfo"
                    (resourceReloaded)="onResourceReloaded($event)" />
                </div>
              } @else if (!cell.isEmpty) {
                <!-- The read-only family: link, file-value, geometry and anything the ontology
                     does not mark editable. GenerateProperty.commonProperty drops them, so there
                     is no PropertyInfoValues to hand the viewer and no editor to mount — they
                     render as text, and keep the collapse a viewer cell cannot have (REQ-4.7). -->
                @let expanded = isExpanded(row.id, column.key);
                <div class="cell-values" [appScrollWhenTaller]="rowCap(row.id)">
                  @for (value of expanded ? cell.values : cell.collapsedValues; track value.id) {
                    <span class="cell-value">{{ value.strval }}</span>
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

        <!-- Takes up whatever width the columns leave, so the table spans the container without
             the browser stretching the real columns past their stored widths. Not a cdkDrag, so
             column reorder never sees it. -->
        <ng-container [matColumnDef]="fillerColumnKey">
          <th mat-header-cell *matHeaderCellDef class="filler-cell" aria-hidden="true"></th>
          <td mat-cell *matCellDef class="filler-cell" aria-hidden="true"></td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns(); sticky: true"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns()"
          [style.height.px]="rowHeightFor(row.id)"
          [style.--row-cap.px]="rowCap(row.id)"
          [class.is-selected]="row.id === selectedResourceId()"
          [class.is-checked]="checkedResourceIds().has(row.id)"
          (click)="resourceSelected.emit(row.resource)"></tr>
      </table>
    </div>
  `,
  styleUrl: './data-table.component.scss',
  imports: [
    MatTableModule,
    MatIcon,
    TranslatePipe,
    MatCheckbox,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ColumnResizeDirective,
    ScrollWhenTallerDirective,
    RowResizeDirective,
    ResourceExplorerButtonComponent,
    TablePropertyCellComponent,
  ],
  providers: [
    // Two services the viewer's subtree injects but does not provide, and which are genuinely
    // table-wide rather than per cell.
    //
    // `PropertiesDisplayService` is a pair of user preferences read out of `localStorage` in its
    // constructor; one per cell would be a thousand `localStorage` reads per page, for a setting
    // that cannot differ between two cells of the same table. `FootnoteService` collects the
    // footnotes a rich-text value declares — the table renders no footnote list, so a shared sink
    // is enough and spares each cell an instance.
    PropertiesDisplayService,
    FootnoteService,
  ],
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
  /**
   * IRIs of the resources in the comparison selection, so their row checkboxes read as checked.
   *
   * A set rather than the resources themselves: the table compares by IRI, never by identity. Every
   * re-query builds fresh `ReadResource` instances, so after a filter change the resource the user
   * had checked is a different object with the same IRI — the reason `MultipleViewerService` is
   * written to compare by `id` too.
   */
  readonly checkedResourceIds = input<ReadonlySet<string>>(new Set<string>());
  /**
   * Whether the user is building a comparison set.
   *
   * While they are, every row shows its checkbox rather than only the one under the pointer —
   * which is what the list view does (`resource-list-item` renders its checkbox on
   * `showCheckbox || selectMode`). Hover-only would mean the set you are assembling is visible one
   * row at a time, and the next row you want is always the one you cannot see.
   */
  readonly selectionActive = input(false);

  readonly resourceSelected = output<ReadResource>();
  /**
   * A row's checkbox, as a change rather than as "add" and "remove" outputs.
   *
   * The host maps it onto `MultipleViewerService.addResources` / `removeResources`, which is how
   * the list view's row behaves — including past six, where the viewer itself takes over and shows
   * the too-many-resources message (REQ-5.4).
   */
  readonly resourceCheckedChanged = output<{ resource: ReadResource; checked: boolean }>();
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
  /**
   * A row's resource as dsp-api holds it after a cell was saved.
   *
   * The table has already re-rendered the row from it; this is for whoever else is showing the
   * same resource — the viewer beside the table owns a `ResourceFetcherService` of its own and
   * would otherwise keep displaying the value the user has just replaced.
   */
  readonly resourceReloaded = output<ReadResource>();

  private readonly _table = viewChild(MatTable);

  /**
   * What the table is currently showing, as one value.
   *
   * Changing either half means the rows on screen are no longer the rows that were there — a new
   * page, a new sort, a new filter, a new class. Everything the user did *to* those rows is keyed
   * off this so that it is discarded exactly then, which is what REQ-4.11 asks for, rather than by
   * each of those five gestures remembering to clear it. The open editors go with them: a cell's
   * editor lives inside the row's view, so replacing the rows destroys it.
   */
  private readonly _dataIdentity = computed(() => ({ resources: this.resources(), columns: this.columns() }));

  /**
   * Resources re-fetched after a save, overlaid on the page the query returned.
   *
   * An overlay rather than a new query: re-running the search would re-sort and re-filter, and a
   * row whose new value no longer matches would jump or vanish under the user who had just typed
   * it. The query's order is left alone and only the row's contents are replaced (REQ-4.4,
   * REQ-4.5).
   */
  private readonly _reloaded = linkedSignal<unknown, ReadonlyMap<string, ReadResource>>({
    source: this._dataIdentity,
    computation: () => new Map(),
  });

  readonly rows = computed<TableRow[]>(() => {
    const reloaded = this._reloaded();
    const resources =
      reloaded.size === 0 ? this.resources() : this.resources().map(resource => reloaded.get(resource.id) ?? resource);
    return buildRows(resources, this.columns());
  });

  protected readonly fillerColumnKey = FILLER_COLUMN_KEY;

  /** The visible columns plus the trailing filler. Only the template sees the filler. */
  protected readonly displayedColumns = computed(() => [...this.visibleColumns(), FILLER_COLUMN_KEY]);

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

  /**
   * Which `(rowId, columnKey)` read-only cells the user has expanded.
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

  protected onRowCheckChanged(resource: ReadResource, event: MatCheckboxChange): void {
    this.resourceCheckedChanged.emit({ resource, checked: event.checked });
  }

  /**
   * Move a column with the keyboard.
   *
   * CDK drag-drop has no keyboard equivalent at all — a pointer is the only way to reorder a
   * `cdkDropList` — so without this the whole reorder feature is unavailable to anyone not using a
   * mouse. The grip is already a button with an accessible name; the arrow keys give it the action
   * its name promises.
   */
  protected onGripKeydown(key: string, event: KeyboardEvent): void {
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (delta === 0) {
      return;
    }

    const order = [...this.visibleColumns()];
    const from = order.indexOf(key);
    const to = from + delta;
    // `to > 0`, not `>= 0`: index 0 is the sticky label column, which stays pinned to the left edge
    // (REQ-2.10) — the same rule `canDropAt` enforces for the pointer.
    if (from < 0 || to <= 0 || to >= order.length) {
      return;
    }

    // Otherwise the arrow also scrolls the table horizontally, so the column the user just moved
    // slides out from under them.
    event.preventDefault();
    moveItemInArray(order, from, to);
    this.columnsReordered.emit(order);
  }

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

  /**
   * Replace one row's resource with what dsp-api returned after a save, a delete or a reorder.
   *
   * Only the overlay moves; `resources` is left as the query returned it, so the row keeps its
   * position and `trackBy` keeps its view. Every cell of the row is rebound, which re-primes each
   * one's fetcher and returns any open editor in the row to display mode — the same thing the
   * resource viewer does to its own properties when it reloads.
   */
  protected onResourceReloaded(resource: ReadResource): void {
    this._reloaded.update(current => new Map(current).set(resource.id, resource));
    this.resourceReloaded.emit(resource);
  }

  /**
   * The height every row is set to from View options, or undefined for Auto — rows hug their
   * content, however tall that is.
   */
  readonly rowHeight = input<number | undefined>(undefined);

  /**
   * The height a row is drawn at: its own dragged height, else the View-options height, else
   * none, which leaves it to its content.
   *
   * A method rather than a computed map because it is called once per row, not per cell, and a
   * map rebuilt on every height change would cost more than the twenty-five lookups it replaces.
   */
  protected rowHeightFor(id: string): number | undefined {
    return this.rowHeights()[id] ?? this.rowHeight();
  }

  /**
   * The height past which a cell in this row scrolls rather than stretching it, or undefined when
   * the row has no height set and so no cell in it ever scrolls.
   *
   * There is no cap of its own: a row the user has not sized grows to whatever its content needs.
   * A height only becomes a cap once the user asks for one, because only then is there a reason to
   * hide part of a cell. Read both by the row, as `--row-cap`, and by each cell's
   * `ScrollWhenTallerDirective`, which decides whether that particular cell is tall enough to need
   * it.
   */
  protected rowCap(id: string): number | undefined {
    return this.rowHeightFor(id);
  }

  /** Below this a row has no room for one line of text plus its padding. */
  protected readonly rowMinHeight = 32;

  /**
   * Heights the user has dragged rows to, by resource IRI.
   *
   * Held here rather than in the persisted layout, and so lost on re-query, page change or
   * reload. A column belongs to the class and there are tens of them; a row belongs to one
   * resource and there may be forty thousand, so persisting would grow the stored layout without
   * any bound — and a height dragged to read one long value is rarely wanted again a week later.
   * Keyed by IRI rather than by index so a row keeps its height while the page re-renders around
   * it, which `trackBy` already does for the row itself.
   *
   * Linked to the View-options row height, so moving the slider clears every one of them. The
   * slider is a request for the whole table to be one size; leaving the rows the user had dragged
   * at their own heights would answer it with a table that is all one size except where it is not.
   * A `linkedSignal` rather than an effect because "writable, but reset whenever this other value
   * changes" is exactly what it is — and it resets only on a real change, so re-rendering with the
   * same height leaves the user's drags alone.
   */
  protected readonly rowHeights = linkedSignal<number | undefined, Record<string, number>>({
    source: this.rowHeight,
    computation: () => ({}),
  });

  protected onRowResized(id: string, height: number): void {
    this.rowHeights.update(heights => ({ ...heights, [id]: height }));
  }

  protected onRowHeightReset(id: string): void {
    this.rowHeights.update(heights => {
      const next = { ...heights };
      delete next[id];
      return next;
    });
  }

  /** Stable across re-queries, so a page change re-uses rows instead of rebuilding every cell. */
  protected readonly trackRow = (_: number, row: TableRow) => row.id;
}
