import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { DEFAULT_DENSITY, TableColumn, TableDensity } from './table-column.model';
import { buildRows, TableRow } from './table-row.model';

/** A column with its width already resolved, so the template does no lookups. */
interface RenderColumn extends TableColumn {
  readonly width: number;
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
      <table
        mat-table
        [dataSource]="rows()"
        [fixedLayout]="true"
        [trackBy]="trackRow"
        role="grid"
        [attr.aria-label]="'pages.dataBrowser.table.label' | translate">
        <!-- Every column keeps its definition mounted; only the displayed-columns array changes.
             Dropping a def when its column is hidden makes MatTable re-register the remaining
             ones, and a displayed key with no surviving def throws. -->
        @for (column of renderColumns(); track column.key) {
          <ng-container [matColumnDef]="column.key" [sticky]="column.isSticky">
            <!-- Width on the header only: under table-layout fixed the first row fixes the column
                 widths, so binding it on every cell would be 25x the bindings for the same result.
                 MatTable emits role=columnheader but no scope, and no aria-sort unless matSort is
                 used — the Data tab's sort lives in the URL, so both are set here. -->
            <th
              mat-header-cell
              *matHeaderCellDef
              scope="col"
              [style.width.px]="column.width"
              [attr.aria-sort]="
                column.key === sortedColumnKey() ? (sortDescending() ? 'descending' : 'ascending') : null
              ">
              <span class="header-label" [title]="column.label">{{ column.label }}</span>
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
  imports: [MatTableModule, MatIcon, TranslatePipe],
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

  readonly resourceSelected = output<ReadResource>();

  readonly rows = computed<TableRow[]>(() => buildRows(this.resources(), this.columns()));

  protected readonly renderColumns = computed<RenderColumn[]>(() => {
    const widths = this.columnWidths();
    return this.columns().map(column => ({ ...column, width: widths[column.key] ?? column.defaultWidth }));
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

  /** Stable across re-queries, so a page change re-uses rows instead of rebuilding every cell. */
  protected readonly trackRow = (_: number, row: TableRow) => row.id;
}
