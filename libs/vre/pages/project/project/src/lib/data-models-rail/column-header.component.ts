import { ChangeDetectionStrategy, Component, contentChild, input } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ColumnResizeDirective } from '@dasch-swiss/vre/pages/data-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { TableColumns } from './table-columns';

/**
 * A column's header in the Data models tables: its name, a filter whose menu holds the content projected here, and
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
  styleUrl: './column-header.component.css',
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

  /** The filter's text field, if it has one. */
  private readonly _textField = contentChild(MatInput);
  /** The filter's first option, if it has options. */
  private readonly _firstOption = contentChild(MatCheckbox);

  /** The filter's field, or its first option, gets the focus as its menu opens, once the menu has focused itself. */
  focusInput(): void {
    setTimeout(() => (this._textField() ?? this._firstOption())?.focus());
  }
}
