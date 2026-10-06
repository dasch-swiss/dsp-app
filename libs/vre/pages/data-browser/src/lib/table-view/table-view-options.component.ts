import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { ColumnPickerEntry } from './table-view-state.service';

/**
 * The table's shaping control: which of its columns are drawn.
 *
 * A menu rather than an inline control because the header row it sits in is already carrying the
 * result count, the pager and the view toggle.
 *
 * Presentational. It takes the picker's rows as input and emits the user's intent, so the story
 * suite can drive it without the layout store, and so the component has no opinion on where the
 * state it edits is kept.
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
        <!-- Every click inside a mat-menu bubbles to the panel, which closes on it. Shaping a table
           is iterative, so each row stops the event: a user ticking four columns should not have
           to reopen the menu four times. -->
        <h4 class="section-header">
          {{ 'pages.dataBrowser.viewOptions.columns' | translate }}
          <span class="section-meta">
            {{
              'pages.dataBrowser.viewOptions.columnsShown'
                | translate: { count: visibleCount(), total: entries().length }
            }}
          </span>
        </h4>

        <!-- One control rather than a Show all beside a Hide all: only one of the two is ever the
             useful next move, and the pair would make the user read both to find out which. It
             reads the current state and offers the other, the way a select-all checkbox does. -->
        <button
          mat-menu-item
          type="button"
          class="option-row bulk-row"
          data-cy="columns-bulk-toggle"
          (click)="$event.stopPropagation(); allColumnsVisibilityChanged.emit(!allShown())">
          <!-- An eye, not a checkbox. The rows below it are checkboxes because each carries a
               column's own on/off state; this row carries none — it performs an action on all of
               them. Borrowing their mark would invite the reader to look for which state it is
               reporting. The eye is also what the column header's own hide control uses. -->
          <mat-icon class="option-mark">{{ allShown() ? 'visibility_off' : 'visibility' }}</mat-icon>
          <span class="option-label">
            {{
              (allShown() ? 'pages.dataBrowser.viewOptions.hideAll' : 'pages.dataBrowser.viewOptions.showAll')
                | translate
            }}
          </span>
        </button>

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

  readonly columnVisibilityChanged = output<{ key: string; isVisible: boolean }>();
  /** True to show every column, false to hide every column but the sticky one. */
  readonly allColumnsVisibilityChanged = output<boolean>();

  protected readonly visibleCount = computed(() => this.entries().filter(entry => entry.isVisible).length);

  /**
   * Whether every column the user can actually hide is currently shown.
   *
   * The sticky column is excluded rather than counted as always-on: counting it would mean a class
   * whose only hideable columns are all hidden still reported "not all shown", and the control
   * would offer to hide what is already hidden.
   */
  protected readonly allShown = computed(() => this.entries().every(entry => entry.column.isSticky || entry.isVisible));
}
