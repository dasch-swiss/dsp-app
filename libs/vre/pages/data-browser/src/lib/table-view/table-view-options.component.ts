import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ROW_HEIGHT_AUTO, ROW_HEIGHT_MAX, ROW_HEIGHT_MIN, ROW_HEIGHT_STEP } from './table-column.model';
import { ColumnPickerEntry } from './table-view-state.service';

/**
 * The table's shaping controls: how tall its rows are, and which of its columns are drawn.
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
        <h4 class="section-header">
          {{ 'pages.dataBrowser.viewOptions.rowHeight' | translate }}
          <span class="section-meta" data-cy="row-height-value">{{ rowHeightLabel() }}</span>
        </h4>

        <!-- Not a menu item, so the panel's own click handler would close the menu on the first
             touch of the thumb; the wrapper swallows it. A slider rather than steps because the
             right height depends on what is in the cells, and that is not something a short list
             of presets can anticipate. -->
        <div class="row-height-control" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
          <!-- Not discrete: its value bubble floats above the thumb and, at either end of the
               track, past the panel's edge, where the panel — which must not scroll sideways —
               clips it. In German the bottom stop reads Automatisch, twice the width of Auto. The
               section header above shows the same value, with room to spare. -->
          <mat-slider data-cy="row-height-slider" [min]="sliderMin" [max]="sliderMax" [step]="sliderStep">
            <input
              matSliderThumb
              [value]="rowHeight() ?? sliderMin"
              [attr.aria-label]="'pages.dataBrowser.viewOptions.rowHeight' | translate"
              [attr.aria-valuetext]="rowHeightLabel()"
              (input)="onSliderInput($event)" />
          </mat-slider>
        </div>

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
  imports: [MatButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatSlider, MatSliderThumb, TranslatePipe],
})
export class TableViewOptionsComponent {
  private readonly _translate = inject(TranslateService);

  /** Every column of the class with its current on/off state, in the ontology's own order. */
  readonly entries = input.required<ColumnPickerEntry[]>();
  /** The height every row is drawn at, or undefined for Auto. */
  readonly rowHeight = input<number | undefined>(undefined);

  /** A height in pixels, or undefined when the slider is returned to Auto. */
  readonly rowHeightChanged = output<number | undefined>();

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

  protected readonly sliderMin = ROW_HEIGHT_AUTO;
  protected readonly sliderMax = ROW_HEIGHT_MAX;
  protected readonly sliderStep = ROW_HEIGHT_STEP;

  /**
   * The section's value, and the thumb's `aria-valuetext`, so a screen reader hears "Auto" rather
   * than the sentinel 40. Live during a drag, because the height is applied as the thumb moves.
   */
  protected readonly rowHeightLabel = computed(() => {
    const value = this.rowHeight() ?? ROW_HEIGHT_AUTO;
    return value <= ROW_HEIGHT_AUTO
      ? this._translate.instant('pages.dataBrowser.viewOptions.rowHeightAuto')
      : `${value}px`;
  });

  /**
   * The bottom stop is Auto rather than a height. It sits one step below the smallest real height
   * so the slider has somewhere to return to, and it emits `undefined` rather than a number so the
   * layout stores nothing at all instead of a sentinel every reader would have to know about.
   *
   * `input` rather than MatSlider's `valueChange`: the table follows the thumb while it is dragged
   * instead of jumping once on release. The range input only fires when the value crosses a step,
   * so a gesture writes the layout once per 8px, not once per pixel.
   */
  protected onSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const height = value <= ROW_HEIGHT_AUTO ? undefined : Math.max(ROW_HEIGHT_MIN, value);
    if (height !== this.rowHeight()) {
      this.rowHeightChanged.emit(height);
    }
  }
}
