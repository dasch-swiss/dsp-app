import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import {
  FootnoteService,
  PropertiesDisplayService,
  ResourceExplorerButtonComponent,
  EditableResourceAuthorshipComponent,
  EditableResourceLabelComponent,
} from '@dasch-swiss/vre/resource-editor/resource-editor';
import { ProjectDataRights } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ColumnResizeDirective } from './column-resize.directive';
import { RowResizeDirective } from './row-resize.directive';
import { ScrollWhenTallerDirective } from './scroll-when-taller.directive';
import { editWidthForValueType, LABEL_COLUMN_KEY, TableColumn } from './table-column.model';
import { TableImageCellComponent } from './table-image-cell.component';
import { TablePropertyCellComponent } from './table-property-cell.component';
import { buildRow, RowRights, TableRow, withRights } from './table-row.model';
import { TruncatedTooltipDirective } from './truncated-tooltip.directive';

/** A column with everything its header needs already resolved, computed once per change to the inputs rather than per binding. */
interface RenderColumn extends TableColumn {
  readonly width: number;
  /** `null` on every column but the sorted one: exactly one header may announce the sort. */
  readonly ariaSort: 'ascending' | 'descending' | null;
  readonly isSorted: boolean;
  readonly sortIcon: string;
  /** What the sort button would do next, which is also what its accessible name must say. */
  readonly nextSortDescending: boolean;
  readonly sortLabelKey: string;
  /** The same as the label, without the column name: the tooltip sits on the column already. */
  readonly sortTooltipKey: string;
  readonly isFiltered: boolean;
  readonly filterLabelKey: string;
  readonly filterTooltipKey: string;
  /** Pinned after the label by the user. Never true on the label itself. */
  readonly isPinned: boolean;
  /** Why the column cannot be edited here, as a translation key; `null` when it can, or when the user could not edit anything anyway. */
  readonly readOnlyReasonKey: string | null;
}

/** The trailing column that absorbs the table's spare width. `__` like the label key, so it cannot collide with a property IRI. */
const FILLER_COLUMN_KEY = '__filler';

/**
 * The Data tab's table view.
 *
 * Presentational: it takes the page's resources and a column model as inputs and knows nothing about Gravsearch, paging or the URL.
 *
 * Uses the native `<table mat-table>` because column resize needs reliable pixel widths, which the flex `<mat-table>` cannot hold.
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- cdkScrollable: overlays opened from a cell close on scroll only if the scroll container is registered. -->
    <div
      #scroller
      cdkScrollable
      class="table-scroll"
      [class.selection-active]="selectionActive()"
      [class.no-selection]="!selectable()"
      [class.is-scrolled-x]="scrolledUnder().shadowed"
      (scroll)="measureScroll()">
      <!-- The drop list is the table, not the header row: cdkDrag resolves its drop list through the view it
           was declared in, and the header cells live in the column defs. The element container keeps the drop
           placeholder inside the header row. -->
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
        <!-- Every column def stays mounted: dropping one when its column is hidden makes MatTable re-register
             the rest, and a displayed key with no def throws. -->
        @for (column of renderColumns(); track column.key) {
          <ng-container [matColumnDef]="column.key" [sticky]="column.isSticky || column.isPinned">
            <!-- Width on the header only: under table-layout fixed the first row fixes the widths. MatTable emits
                 no scope and no aria-sort without matSort, so both are set here; the explicit aria-label keeps the
                 inner buttons' labels out of the column name. -->
            <th
              mat-header-cell
              *matHeaderCellDef
              scope="col"
              [class.is-label-header]="column.isSticky"
              [style.width.px]="column.width"
              [attr.aria-label]="
                column.readOnlyReasonKey
                  ? column.label + ', ' + ('pages.dataBrowser.table.readOnly' | translate)
                  : column.label
              "
              [attr.aria-sort]="column.ariaSort"
              cdkDrag
              [cdkDragData]="column.key"
              [cdkDragDisabled]="column.isSticky"
              [class.is-movable]="!column.isSticky"
              [class.is-pinned]="column.isPinned"
              [class.is-frozen]="column.isSticky || column.isPinned"
              [class.is-read-only]="column.readOnlyReasonKey"
              [attr.tabindex]="column.isSticky ? null : 0"
              [attr.aria-keyshortcuts]="column.isSticky ? null : 'ArrowLeft ArrowRight'"
              (keydown)="onHeaderKeydown(column.key, $event)">
              <div class="header-content">
                @if (column.readOnlyReasonKey; as reasonKey) {
                  <mat-icon class="header-lock" data-cy="column-read-only" [matTooltip]="reasonKey | translate"
                    >lock</mat-icon
                  >
                }
                <span class="header-label" [appTruncatedTooltip]="column.label">{{ column.label }}</span>

                @if (column.isSortable) {
                  <button
                    type="button"
                    class="header-sort"
                    [class.is-active]="column.isSorted"
                    data-cy="column-sort"
                    [attr.aria-label]="column.sortLabelKey | translate: { column: column.label }"
                    [matTooltip]="column.sortTooltipKey | translate"
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
                    [matTooltip]="column.filterTooltipKey | translate"
                    (click)="filterRequested.emit(column.key)">
                    <mat-icon>filter_list</mat-icon>
                  </button>
                }

                @if (column.isSticky && scrolledUnder().count > 0) {
                  @let hiddenColumns =
                    (scrolledUnder().count === 1
                      ? 'pages.dataBrowser.table.oneColumnScrolledUnder'
                      : 'pages.dataBrowser.table.columnsScrolledUnder'
                    ) | translate: { count: scrolledUnder().count };
                  @let scrollBack = hiddenColumns + '. ' + ('pages.dataBrowser.table.scrollBackToStart' | translate);
                  <button
                    type="button"
                    class="scroll-back"
                    data-cy="scrolled-under-hint"
                    [attr.aria-label]="scrollBack"
                    [matTooltip]="scrollBack"
                    (click)="scrollToStart()">
                    <mat-icon>chevron_left</mat-icon>{{ scrolledUnder().count }}
                  </button>
                }

                @if (!column.isSticky) {
                  <button
                    type="button"
                    class="header-pin"
                    [class.is-active]="column.isPinned"
                    data-cy="column-pin"
                    [attr.aria-pressed]="column.isPinned"
                    [attr.aria-label]="
                      (column.isPinned ? 'pages.dataBrowser.table.unpinColumn' : 'pages.dataBrowser.table.pinColumn')
                        | translate: { column: column.label }
                    "
                    [matTooltip]="
                      (column.isPinned ? 'pages.dataBrowser.table.unpin' : 'pages.dataBrowser.table.pin') | translate
                    "
                    (click)="columnPinToggled.emit(column.key)">
                    <mat-icon>push_pin</mat-icon>
                  </button>
                }
              </div>

              <span
                appColumnResize
                data-cy="column-resize"
                [minWidth]="column.minWidth"
                [defaultWidth]="column.defaultWidth"
                [width]="column.width"
                (widthChanged)="onColumnResized(column.key, $event)"
                (widthReset)="onColumnWidthReset(column.key)"
                [attr.aria-label]="'pages.dataBrowser.table.resizeColumn' | translate: { column: column.label }"></span>
            </th>

            <td
              mat-cell
              *matCellDef="let row"
              [class.is-label-cell]="column.isSticky"
              [class.is-frozen]="column.isSticky || column.isPinned">
              <!-- Row controls ride in the sticky label cell, absolutely positioned, rather than in extra sticky columns;
                   the header label is indented by the same gutter. -->
              @if (column.isSticky) {
                <span
                  appRowResize
                  data-cy="row-resize"
                  [minHeight]="rowMinHeight"
                  [height]="rowHeightFor(row.id)"
                  [fallbackHeight]="rowHeight()"
                  (heightChanged)="onRowResized(row.id, $event)"
                  (heightReset)="onRowHeightReset(row.id)"
                  [attr.aria-label]="'pages.dataBrowser.table.resizeRow' | translate: { label: row.label }"></span>
                <div class="row-controls">
                  @if (selectable()) {
                    <mat-checkbox
                      data-cy="row-check"
                      [checked]="checkedResourceIds().has(row.id)"
                      [attr.aria-label]="'pages.dataBrowser.table.selectRow' | translate: { label: row.label }"
                      (change)="onRowCheckChanged(row.resource, $event)" />
                  }
                  <app-resource-explorer-button
                    class="row-open"
                    data-cy="row-open"
                    [resourceIri]="row.id"
                    [ariaLabel]="'pages.dataBrowser.table.openRow' | translate: { label: row.label }" />
                </div>
              }

              @let cell = row.cells[column.key];
              @if (cell.isEmpty && !cell.propertyInfo) {
                <!-- Read-only cells only: a viewer cell already shows its own empty state. -->
                <span class="cell-empty">{{ 'pages.dataBrowser.table.notSet' | translate }}</span>
              }

              @if (column.key === labelColumnKey && row.dspResource; as dspResource) {
                <div class="cell-values" [appScrollWhenTaller]="rowCap(row.id)">
                  <app-editable-resource-label
                    [dspResource]="dspResource"
                    (resourceUpdated)="onResourceReloaded($event)" />
                </div>
              } @else if (column.rightsField === 'authorship' && row.dspResource; as dspResource) {
                <div class="cell-values" [appScrollWhenTaller]="rowCap(row.id)">
                  <app-editable-resource-authorship
                    [dspResource]="dspResource"
                    [defaultAuthorship]="projectRights()?.defaultDataAuthorship ?? []"
                    (resourceUpdated)="onResourceReloaded($event)" />
                </div>
              } @else if (cell.text !== undefined) {
                <!-- Same wrapper as a property cell: cell-value only truncates as a flex item. -->
                <div class="cell-values" [appScrollWhenTaller]="rowCap(row.id)">
                  @if (cell.href) {
                    <a
                      class="cell-value"
                      [href]="cell.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      [attr.aria-label]="cell.text + ', ' + ('legal.dataSide.opensInNewTab' | translate)"
                      >{{ cell.text }}</a
                    >
                  } @else if (cell.isFallback) {
                    <em
                      class="cell-value cell-fallback"
                      [title]="'legal.dataSide.noAuthorshipFallback' | translate: { default: cell.text }"
                      >{{ cell.text }}</em
                    >
                  } @else {
                    <span class="cell-value">{{ cell.text }}</span>
                  }
                </div>
              } @else if (cell.image; as image) {
                <app-table-image-cell [image]="image" [label]="row.label" />
              } @else if (cell.propertyInfo; as propertyInfo) {
                <div class="cell-property" [appScrollWhenTaller]="rowCap(row.id)">
                  <app-table-property-cell
                    [dspResource]="row.dspResource!"
                    [myProperty]="propertyInfo"
                    (resourceReloaded)="onResourceReloaded($event)"
                    (editingChange)="onCellEditingChange(row.id, column.key, $event)" />
                </div>
              } @else if (!cell.isEmpty) {
                <!-- GenerateProperty.commonProperty drops these, so there is no PropertyInfoValues for the viewer. -->
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
                      (click)="toggleExpanded(row.id, column.key)">
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

        <!-- Not a cdkDrag, so column reorder never sees it. -->
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
          [class.is-checked]="checkedResourceIds().has(row.id)"></tr>
      </table>
    </div>
    <!-- Drawn over the table: a collapsed-border table does not paint its cells' box-shadow. -->
    @if (scrolledUnder().shadowed) {
      <span
        class="frozen-shadow"
        data-cy="frozen-shadow"
        aria-hidden="true"
        [style.left.px]="scrolledUnder().edge"
        [style.height.px]="scrolledUnder().height"></span>
    }
  `,
  styleUrl: './data-table.component.scss',
  imports: [
    CdkScrollable,
    MatTableModule,
    MatIcon,
    TranslatePipe,
    MatCheckbox,
    MatTooltip,
    CdkDropList,
    CdkDrag,
    ColumnResizeDirective,
    ScrollWhenTallerDirective,
    RowResizeDirective,
    ResourceExplorerButtonComponent,
    EditableResourceLabelComponent,
    EditableResourceAuthorshipComponent,
    TableImageCellComponent,
    TablePropertyCellComponent,
    TruncatedTooltipDirective,
  ],
  providers: [
    // Provided table-wide, not per cell: `PropertiesDisplayService` reads `localStorage` in its constructor,
    // and the table renders no footnote list so `FootnoteService` needs only a shared sink.
    PropertiesDisplayService,
    FootnoteService,
  ],
})
export class DataTableComponent {
  /** The page's resources, already fetched in full. */
  readonly resources = input.required<ReadResource[]>();
  /** Every column of the class, visible or not. Drives the mounted column definitions. */
  readonly columns = input.required<TableColumn[]>();
  /** The project's legal info, for the rights-statement columns. Undefined while it loads. */
  readonly projectRights = input<ProjectDataRights | undefined>(undefined);
  /** Keys of the columns to show, in display order. A subset of `columns`, label first. */
  readonly visibleColumns = input.required<string[]>();
  /** Pixel widths the user has set. A column absent here falls back to its `defaultWidth`. */
  readonly columnWidths = input<Readonly<Record<string, number>>>({});
  /** The sort the query is running, so the matching header can announce `aria-sort`. */
  readonly sortedColumnKey = input<string | undefined>(undefined);
  readonly sortDescending = input(false);
  /** Keys of the columns a filter chip currently exists on, derived from the shared filter state. */
  readonly filteredColumnKeys = input<ReadonlySet<string>>(new Set<string>());
  /** Keys of the columns pinned after the label, in display order. Always visible ones. */
  readonly pinnedColumns = input<readonly string[]>([]);
  /**
   * IRIs of the resources in the comparison selection.
   *
   * A set of IRIs, never resource identity: every re-query builds fresh `ReadResource` instances.
   */
  readonly checkedResourceIds = input<ReadonlySet<string>>(new Set<string>());
  /** Whether the user is building a comparison set; while they are, every row shows its checkbox. */
  readonly selectionActive = input(false);
  /** Whether rows can be selected for comparison at all. Off for anonymous visitors. */
  readonly selectable = input(true);
  /** Whether the user may edit this project's data. Only then are read-only columns marked. */
  readonly canEdit = input(false);

  /**
   * A row's checkbox, as a change rather than "add" and "remove" outputs.
   *
   * The host maps it onto `MultipleViewerService.addResources` / `removeResources`.
   */
  readonly resourceCheckedChanged = output<{ resource: ReadResource; checked: boolean }>();
  /** The whole new display order, not a delta — the host persists the array as it stands. */
  readonly columnsReordered = output<string[]>();
  readonly columnResized = output<{ key: string; width: number }>();
  /** A column's stored width is dropped, so it renders at its default again. */
  readonly columnWidthReset = output<string>();
  /**
   * The sort the user just asked for, already resolved to a direction.
   *
   * Two-state by design: Gravsearch has no "unsorted", it orders by label.
   */
  readonly sortToggled = output<{ key: string; descending: boolean }>();
  /** The column whose filter the user wants to edit. The host decides where the editor opens. */
  readonly filterRequested = output<string>();
  /** Emits the column whose pin the user toggled. */
  readonly columnPinToggled = output<string>();
  /**
   * A row's resource as dsp-api holds it after a cell was saved. The table has already re-rendered the row;
   * this is for whoever else shows the same resource.
   */
  readonly resourceReloaded = output<ReadResource>();

  private readonly _table = viewChild(MatTable);
  private readonly _scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  /**
   * How far the table is scrolled sideways, as the frozen zone sees it: whether there is a frozen edge to shade,
   * how many scrolling columns are hidden under it, and where its edge and the header's bottom are.
   */
  protected readonly scrolledUnder = signal(
    { shadowed: false, count: 0, edge: 0, top: 0, height: 0 },
    {
      equal: (a, b) =>
        a.shadowed === b.shadowed &&
        a.count === b.count &&
        a.edge === b.edge &&
        a.top === b.top &&
        a.height === b.height,
    }
  );

  constructor() {
    // Pinning, hiding or resizing a column moves the frozen edge without a scroll event.
    afterRenderEffect({
      read: () => {
        this.renderColumns();
        this.measureScroll();
      },
    });
    // MatTable does not recompute the sticky offsets after a column is widened for its editor.
    afterRenderEffect({
      write: () => {
        this._editingColumns();
        this._table()?.updateStickyColumnStyles();
      },
    });
  }

  /**
   * What the table is currently showing, as one value.
   *
   * State tied to the rows on screen is keyed off this so it is discarded when they are replaced.
   */
  private readonly _dataIdentity = computed(() => ({ resources: this.resources(), columns: this.columns() }));

  /**
   * Resources re-fetched after a save, overlaid on the page the query returned.
   *
   * Re-running the query would re-sort and re-filter under the user. Reset by a new page only, not new columns: a language switch rebuilds the columns.
   */
  private readonly _reloaded = linkedSignal<unknown, ReadonlyMap<string, ReadResource>>({
    source: this.resources,
    computation: () => new Map(),
  });

  private readonly _translate = inject(TranslateService);

  /** Read by `_rowRights` so the placeholder text follows a language switch. */
  private readonly _language = toSignal(this._translate.onLangChange);

  private readonly _rowRights = computed<RowRights>(() => {
    this._language();
    return {
      rights: this.projectRights(),
      placeholderLabel: this._translate.instant('legal.dataSide.placeholder'),
    };
  });

  /**
   * Built rows by `ReadResource` identity, with the rights they were built against. Valid only for
   * `_cacheColumns`: a new column set discards it.
   */
  private _rowCache = new WeakMap<ReadResource, { row: TableRow; rowRights: RowRights }>();
  private _cacheColumns: TableColumn[] | undefined;

  readonly rows = computed<TableRow[]>(() => {
    const reloaded = this._reloaded();
    const resources =
      reloaded.size === 0 ? this.resources() : this.resources().map(resource => reloaded.get(resource.id) ?? resource);
    const columns = this.columns();
    const rowRights = this._rowRights();

    if (columns !== this._cacheColumns) {
      this._rowCache = new WeakMap();
      this._cacheColumns = columns;
    }

    return resources.map(resource => {
      const cached = this._rowCache.get(resource);
      if (cached?.rowRights === rowRights) {
        return cached.row;
      }
      const row = cached ? withRights(cached.row, columns, rowRights) : buildRow(resource, columns, rowRights);
      this._rowCache.set(resource, { row, rowRights });
      return row;
    });
  });

  protected readonly fillerColumnKey = FILLER_COLUMN_KEY;
  protected readonly labelColumnKey = LABEL_COLUMN_KEY;

  /** The visible columns plus the trailing filler. Only the template sees the filler. */
  protected readonly displayedColumns = computed(() => [...this.visibleColumns(), FILLER_COLUMN_KEY]);

  /** The cells with a value open in an editor, as `rowId columnKey`. Cleared with the rows. */
  private readonly _editingCells = linkedSignal<unknown, ReadonlySet<string>>({
    source: this._dataIdentity,
    computation: () => new Set(),
  });

  /** Columns drawn wider while one of their values is being edited. */
  private readonly _editingColumns = computed(
    () => new Set(Array.from(this._editingCells(), cell => cell.slice(cell.indexOf(' ') + 1)))
  );

  protected readonly renderColumns = computed<RenderColumn[]>(() => {
    const widths = this.columnWidths();
    const editing = this._editingColumns();
    const sortedKey = this.sortedColumnKey();
    const descending = this.sortDescending();
    const filtered = this.filteredColumnKeys();
    const pinned = this.pinnedColumns();
    const canEdit = this.canEdit();

    return this.columns().map((column): RenderColumn => {
      const isSorted = column.key === sortedKey;
      // Clicking the sorted column flips it; any other starts ascending.
      const nextSortDescending = isSorted && !descending;
      const isFiltered = filtered.has(column.key);

      return {
        ...column,
        // Never narrower than its editor while one is open; back to its own width once it closes.
        width: editing.has(column.key)
          ? Math.max(widths[column.key] ?? column.defaultWidth, editWidthForValueType(column.valueType))
          : (widths[column.key] ?? column.defaultWidth),
        ariaSort: isSorted ? (descending ? 'descending' : 'ascending') : null,
        isSorted,
        // `swap_vert` reads as sortable; the arrows as sorted in that direction.
        sortIcon: isSorted ? (descending ? 'arrow_downward' : 'arrow_upward') : 'swap_vert',
        nextSortDescending,
        // The name states what the click will do; `aria-sort` on the header carries the current state.
        sortLabelKey: nextSortDescending
          ? 'pages.dataBrowser.table.sortColumnDescending'
          : 'pages.dataBrowser.table.sortColumnAscending',
        sortTooltipKey: nextSortDescending
          ? 'pages.dataBrowser.table.sortDescending'
          : 'pages.dataBrowser.table.sortAscending',
        isFiltered,
        filterLabelKey: isFiltered
          ? 'pages.dataBrowser.table.editColumnFilter'
          : 'pages.dataBrowser.table.filterByColumn',
        filterTooltipKey: isFiltered ? 'pages.dataBrowser.table.editFilter' : 'pages.dataBrowser.table.filter',
        isPinned: pinned.includes(column.key),
        readOnlyReasonKey:
          !canEdit || column.isEditable
            ? null
            : column.rightsField
              ? 'pages.dataBrowser.table.readOnlyProjectWide'
              : 'pages.dataBrowser.table.readOnlyInTable',
      };
    });
  });

  /**
   * Which `(rowId, columnKey)` read-only cells the user has expanded.
   *
   * Keyed by both because rows are rebuilt on every data emission. The space separator is safe: an IRI cannot contain one.
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
   * Keep a moved column within its own group: a pinned column among the pins, any other among the scrolling columns.
   *
   * The label column is drag-disabled, which stops it being picked up but not another column being dropped in front of it.
   */
  protected readonly canDropAt = (index: number, drag: CdkDrag<string>): boolean => {
    const [first, last] = this._slotsFor(drag.data);
    return index >= first && index <= last;
  };

  /** The display indices a column may move between: its group's, after the label at index 0. */
  private _slotsFor(key: string): [number, number] {
    const pinnedCount = this.pinnedColumns().length;
    return this.pinnedColumns().includes(key) ? [1, pinnedCount] : [pinnedCount + 1, this.visibleColumns().length - 1];
  }

  protected onRowCheckChanged(resource: ReadResource, event: MatCheckboxChange): void {
    this.resourceCheckedChanged.emit({ resource, checked: event.checked });
  }

  /**
   * Move a column with the keyboard, from its focused header cell.
   *
   * Only for a key pressed on the cell itself: the resize handle inside it takes the same arrow keys and its keydown bubbles up here.
   */
  protected onHeaderKeydown(key: string, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (delta === 0) {
      return;
    }

    const order = [...this.visibleColumns()];
    const from = order.indexOf(key);
    const to = from + delta;
    // The same groups `canDropAt` keeps for the pointer.
    const [first, last] = this._slotsFor(key);
    if (from < 0 || to < first || to > last) {
      return;
    }

    // Otherwise the arrow also scrolls the table horizontally.
    event.preventDefault();
    moveItemInArray(order, from, to);
    this.columnsReordered.emit(order);
  }

  protected onColumnDropped(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // CDK reports indices in visual order, which for a header row is the displayed order.
    const order = [...this.visibleColumns()];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.columnsReordered.emit(order);
  }

  /** Back to the first column, from the hint that says how many are scrolled under. */
  protected scrollToStart(): void {
    this._scroller().nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
  }

  protected measureScroll(): void {
    const scroller = this._scroller().nativeElement;
    const headers = Array.from(scroller.querySelectorAll<HTMLElement>('thead th'));
    const frozenEdge = headers.filter(th => th.classList.contains('mat-mdc-table-sticky-border-elem-left')).pop();
    if (!frozenEdge || scroller.scrollLeft <= 0) {
      this.scrolledUnder.set({ shadowed: false, count: 0, edge: 0, top: 0, height: 0 });
      return;
    }
    const left = scroller.getBoundingClientRect().left;
    const edge = frozenEdge.getBoundingClientRect().right;
    const count = headers.filter(
      th =>
        // Every header cell is sticky (to the top); the frozen ones are also stuck to the left.
        !th.style.left && !th.classList.contains('filler-cell') && th.getBoundingClientRect().right <= edge + 1
    ).length;
    this.scrolledUnder.set({
      shadowed: true,
      count,
      edge: Math.round(edge - left),
      top: frozenEdge.offsetHeight,
      height: scroller.clientHeight,
    });
  }

  protected onCellEditingChange(rowId: string, columnKey: string, editing: boolean): void {
    const cell = `${rowId} ${columnKey}`;
    this._editingCells.update(current => {
      const next = new Set(current);
      if (editing) {
        next.add(cell);
      } else {
        next.delete(cell);
      }
      return next;
    });
  }

  protected onColumnResized(key: string, width: number): void {
    this.columnResized.emit({ key, width });

    // Under `fixedLayout` MatTable only invalidates its cached sticky offsets when the set of columns changes.
    this._table()?.updateStickyColumnStyles();
  }

  protected onColumnWidthReset(key: string): void {
    this.columnWidthReset.emit(key);
    this._table()?.updateStickyColumnStyles();
  }

  /**
   * Replace one row's resource with what dsp-api returned after a save, a delete or a reorder.
   *
   * Only the overlay moves, so the row keeps its position and `trackBy` keeps its view; only that row is rebuilt.
   */
  protected onResourceReloaded(resource: ReadResource): void {
    this._reloaded.update(current => new Map(current).set(resource.id, resource));
    this.resourceReloaded.emit(resource);
  }

  /** The height every row is set to from View options, or undefined for Auto. */
  readonly rowHeight = input<number | undefined>(undefined);

  /** The height a row is drawn at: its own dragged height, else the View-options height, else none. */
  protected rowHeightFor(id: string): number | undefined {
    return this.rowHeights()[id] ?? this.rowHeight();
  }

  /**
   * The height past which a cell in this row scrolls rather than stretching it, or undefined when the row has no height set.
   *
   * Read by the row as `--row-cap` and by each cell's `ScrollWhenTallerDirective`.
   */
  protected rowCap(id: string): number | undefined {
    return this.rowHeightFor(id);
  }

  /** Below this a row has no room for one line of text plus its padding. */
  protected readonly rowMinHeight = 32;

  /**
   * Heights the user has dragged rows to, by resource IRI.
   *
   * Not persisted: rows are unbounded in number. Reset whenever the View-options row height changes.
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
