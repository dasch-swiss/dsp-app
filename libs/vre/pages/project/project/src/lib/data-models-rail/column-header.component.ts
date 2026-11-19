import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ColumnResizeDirective } from '@dasch-swiss/vre/pages/data-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { TableColumns } from './table-columns';

/**
 * A column's header in the Data models 2 tables: its name, a filter whose menu holds the content projected here, and
 * the handle on its right edge that resizes it. Goes in the `th`, which drags the column.
 */
@Component({
  selector: 'app-column-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnResizeDirective, MatIcon, MatMenu, MatMenuTrigger, TranslatePipe],
  template: `
    <span class="header">
      <span class="header-label">{{ label() | translate }}</span>
      <button
        type="button"
        class="filter"
        [attr.data-cy]="filterCy()"
        [class.on]="filtered()"
        [attr.aria-label]="'pages.dataModels2.filterOn' | translate: { column: label() | translate }"
        [matMenuTriggerFor]="menu"
        (menuOpened)="focusInput()">
        <mat-icon>filter_list</mat-icon>
      </button>
    </span>
    <mat-menu #menu="matMenu" [xPosition]="menuPosition()">
      <!-- The menu stays open while its options are ticked, and only Escape closes it from the keyboard. -->
      <div
        #filterMenu
        class="filter-menu"
        (click)="$event.stopPropagation()"
        (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
        <ng-content />
      </div>
    </mat-menu>
    <span
      appColumnResize
      [attr.data-cy]="resizeCy()"
      [minWidth]="columns().config.minWidths[column()]"
      [defaultWidth]="columns().config.defaultWidths[column()]"
      [width]="columns().widthOf(column())"
      [attr.aria-label]="'pages.dataModels2.resizeColumn' | translate"
      (widthChanged)="columns().resize(column(), $event)"
      (widthReset)="columns().resize(column(), undefined)"></span>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .header-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font: 500 12px/16px var(--font-sans, Roboto, sans-serif);
        letter-spacing: 0.06em;
        color: rgba(0, 0, 0, 0.6);
      }

      :host-context(th.filtered) .header-label {
        color: #234a69;
      }

      // The filter shows while its header is hovered or focused, or while it filters.
      .filter {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: rgba(0, 0, 0, 0.45);
        cursor: pointer;
        visibility: hidden;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        &.on {
          visibility: visible;
          background: #d6e0e8;
          color: $primary;
        }

        &[aria-expanded='true'] {
          visibility: visible;
        }
      }

      :host-context(th:hover) .filter,
      :host-context(th:focus-within) .filter {
        visibility: visible;
      }

      .filter-menu {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 200px;
        padding: 4px 12px;
      }

      // On the header's right edge; the header cell is positioned.
      .column-resize-handle {
        position: absolute;
        top: 0;
        right: -4px;
        bottom: 0;
        width: 8px;
        z-index: 1;
        cursor: col-resize;
        opacity: 0;

        &:hover {
          background: rgba(51, 103, 144, 0.25);
        }

        &:focus-visible {
          opacity: 1;
          outline: 2px solid $primary;
          outline-offset: -1px;
        }
      }

      :host-context(th:hover) .column-resize-handle {
        opacity: 1;
      }

      // The header dragged to move its column shows its name alone.
      :host-context(.cdk-drag-preview) {
        .filter,
        .column-resize-handle {
          display: none;
        }
      }
    `,
  ],
})
export class ColumnHeaderComponent {
  readonly columns = input.required<TableColumns<string>>();
  readonly column = input.required<string>();
  /** The translation key of the column's name. */
  readonly label = input.required<string>();
  /** Whether the column's filter filters something, which keeps it in view. */
  readonly filtered = input(false);
  readonly menuPosition = input<'before' | 'after'>('after');
  readonly filterCy = input<string>();
  readonly resizeCy = input<string>();

  private readonly _filterMenu = viewChild<ElementRef<HTMLElement>>('filterMenu');

  /** A filter typed in gets the focus as its menu opens, once the menu has focused itself. */
  focusInput(): void {
    setTimeout(() => this._filterMenu()?.nativeElement.querySelector('input')?.focus());
  }
}
