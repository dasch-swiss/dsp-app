import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { TableDensity } from './table-column.model';
import { ColumnPickerEntry } from './table-view-state.service';

const DENSITIES: readonly { value: TableDensity; labelKey: string }[] = [
  { value: 'compact', labelKey: 'pages.dataBrowser.viewOptions.densityCompact' },
  { value: 'default', labelKey: 'pages.dataBrowser.viewOptions.densityDefault' },
  { value: 'comfortable', labelKey: 'pages.dataBrowser.viewOptions.densityComfortable' },
];

/**
 * The table's shaping controls: how tall its rows are, and which of its columns are drawn.
 *
 * One menu rather than two controls because both answer the same question — how much of the class
 * do I want on screen at once — and because the row of the header they sit in is already carrying
 * the result count, the pager and the view toggle.
 *
 * Presentational. It takes the picker's rows and the current density as inputs and emits the user's
 * intent, so the story suite can drive it without the layout store, and so the component has no
 * opinion on where the state it edits is kept.
 */
@Component({
  selector: 'app-table-view-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-button
      type="button"
      class="view-options-trigger"
      data-cy="view-options-trigger"
      [matMenuTriggerFor]="menu">
      <mat-icon>tune</mat-icon>
      {{ 'pages.dataBrowser.viewOptions.title' | translate }}
    </button>

    <mat-menu #menu="matMenu" xPosition="before">
      <!-- The panel element belongs to MatMenu's own view and carries none of this component's
           style attributes, so its width and scroll behaviour are set on a wrapper inside the
           projected content instead. -->
      <div class="view-options-panel">
        <h4 class="section-header">{{ 'pages.dataBrowser.viewOptions.density' | translate }}</h4>

        <!-- Every click inside a mat-menu bubbles to the panel, which closes on it. Shaping a table
           is iterative, so each row stops the event: a user ticking four columns should not have
           to reopen the menu four times. -->
        @for (option of densities; track option.value) {
          <button
            mat-menu-item
            type="button"
            role="menuitemradio"
            class="option-row"
            [attr.data-cy]="'density-' + option.value"
            [attr.aria-checked]="option.value === density()"
            (click)="$event.stopPropagation(); densityChanged.emit(option.value)">
            <mat-icon class="option-mark">
              {{ option.value === density() ? 'radio_button_checked' : 'radio_button_unchecked' }}
            </mat-icon>
            {{ option.labelKey | translate }}
          </button>
        }

        <h4 class="section-header">
          {{ 'pages.dataBrowser.viewOptions.columns' | translate }}
          <span class="section-meta">
            {{
              'pages.dataBrowser.viewOptions.columnsShown'
                | translate: { count: visibleCount(), total: entries().length }
            }}
          </span>
        </h4>

        @for (entry of entries(); track entry.column.key) {
          <button
            mat-menu-item
            type="button"
            role="menuitemcheckbox"
            class="option-row"
            [disabled]="entry.column.isSticky"
            [attr.aria-checked]="entry.isVisible"
            (click)="
              $event.stopPropagation();
              columnVisibilityChanged.emit({ key: entry.column.key, isVisible: !entry.isVisible })
            ">
            <mat-icon class="option-mark">{{ entry.isVisible ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            <span class="option-label">{{ entry.column.label }}</span>
            @if (entry.column.isSticky) {
              <!-- The label column is what keeps a row identifiable once the table scrolls sideways,
                 so it is pinned rather than hideable. Saying so beats a checkbox that silently
                 refuses to move. -->
              <span class="option-meta">{{ 'pages.dataBrowser.viewOptions.alwaysShown' | translate }}</span>
            }
          </button>
        }
      </div>
    </mat-menu>
  `,
  styleUrl: './table-view-options.component.scss',
  imports: [MatButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, TranslatePipe],
})
export class TableViewOptionsComponent {
  /** Every column of the class with its current on/off state, in the ontology's own order. */
  readonly entries = input.required<ColumnPickerEntry[]>();
  readonly density = input.required<TableDensity>();

  readonly densityChanged = output<TableDensity>();
  readonly columnVisibilityChanged = output<{ key: string; isVisible: boolean }>();

  protected readonly densities = DENSITIES;

  protected readonly visibleCount = computed(() => this.entries().filter(entry => entry.isVisible).length);
}
