import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ROW_HEIGHT_MANUAL_DEFAULT, ROW_HEIGHT_MAX, ROW_HEIGHT_MIN, ROW_HEIGHT_STEP } from './table-column.model';
import { ColumnPickerEntry } from './table-view-state.service';

/** The table's shaping controls: row height and column visibility. Presentational: takes the picker's rows and emits intent. */
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
      <!-- MatMenu's panel carries none of this component's style attributes, so sizing and scroll are set on a wrapper in the projected content. -->
      <div class="view-options-panel">
        <h4 class="section-header" id="row-height-heading">
          {{ 'pages.dataBrowser.viewOptions.rowHeight' | translate }}
          <span class="section-meta" data-cy="row-height-value">{{ rowHeightLabel() }}</span>
        </h4>

        <!-- Not menu items, so the wrapper swallows clicks that would close the menu, and every key but Escape. -->
        <div class="row-height-control" (click)="$event.stopPropagation()" (keydown)="onControlKeydown($event)">
          <mat-button-toggle-group
            class="row-height-mode"
            data-cy="row-height-mode"
            hideSingleSelectionIndicator
            aria-labelledby="row-height-heading"
            [value]="isManual() ? 'manual' : 'auto'"
            (change)="onModeChange($event.value)">
            <mat-button-toggle value="auto" data-cy="row-height-auto">
              {{ 'pages.dataBrowser.viewOptions.rowHeightAuto' | translate }}
            </mat-button-toggle>
            <mat-button-toggle value="manual" data-cy="row-height-manual">
              {{ 'pages.dataBrowser.viewOptions.rowHeightManual' | translate }}
            </mat-button-toggle>
          </mat-button-toggle-group>

          @if (isManual()) {
            <!-- Not discrete: the value bubble would be clipped at the track ends by the non-scrolling panel. -->
            <mat-slider data-cy="row-height-slider" [min]="sliderMin" [max]="sliderMax" [step]="sliderStep">
              <input
                matSliderThumb
                [value]="rowHeight() ?? lastManualHeight()"
                [attr.aria-label]="'pages.dataBrowser.viewOptions.rowHeight' | translate"
                [attr.aria-valuetext]="rowHeightLabel()"
                (input)="onSliderInput($event)" />
            </mat-slider>
          }
        </div>

        <!-- Each row stops the click so the menu stays open while ticking columns. -->
        <h4 class="section-header">
          {{ 'pages.dataBrowser.viewOptions.columns' | translate }}
          <button
            mat-button
            type="button"
            class="section-action"
            data-cy="columns-bulk-toggle"
            [attr.aria-label]="
              (allShown() ? 'pages.dataBrowser.viewOptions.hideAll' : 'pages.dataBrowser.viewOptions.showAll')
                | translate
            "
            (click)="$event.stopPropagation(); allColumnsVisibilityChanged.emit(!allShown())">
            {{
              (allShown() ? 'pages.dataBrowser.viewOptions.hideAllShort' : 'pages.dataBrowser.viewOptions.showAllShort')
                | translate
            }}
          </button>
        </h4>

        @for (entry of hideableEntries(); track entry.column.key) {
          <button
            mat-menu-item
            type="button"
            role="menuitemcheckbox"
            class="option-row"
            [attr.aria-checked]="entry.isVisible"
            (click)="
              $event.stopPropagation();
              columnVisibilityChanged.emit({ key: entry.column.key, isVisible: !entry.isVisible })
            ">
            <mat-icon class="option-mark">{{ entry.isVisible ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            <span class="option-label">{{ entry.column.label }}</span>
          </button>
        }
      </div>
    </mat-menu>
  `,
  styleUrl: './table-view-options.component.scss',
  imports: [
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatSlider,
    MatSliderThumb,
    TranslatePipe,
  ],
})
export class TableViewOptionsComponent {
  private readonly _translate = inject(TranslateService);

  /** Every column of the class with its current on/off state, in the ontology's own order. */
  readonly entries = input.required<ColumnPickerEntry[]>();
  /** The height every row is drawn at, or undefined for Auto. */
  readonly rowHeight = input<number | undefined>(undefined);

  /** A height in pixels, or undefined when the user picks Auto. */
  readonly rowHeightChanged = output<number | undefined>();

  readonly columnVisibilityChanged = output<{ key: string; isVisible: boolean }>();
  /** True to show every column, false to hide every column but the sticky one. */
  readonly allColumnsVisibilityChanged = output<boolean>();

  /** Whether every hideable column is shown; the sticky column is excluded since it cannot be hidden. */
  protected readonly hideableEntries = computed(() => this.entries().filter(entry => !entry.column.isSticky));

  protected readonly allShown = computed(() => this.entries().every(entry => entry.column.isSticky || entry.isVisible));

  protected readonly sliderMin = ROW_HEIGHT_MIN;
  protected readonly sliderMax = ROW_HEIGHT_MAX;
  protected readonly sliderStep = ROW_HEIGHT_STEP;

  protected readonly isManual = computed(() => this.rowHeight() !== undefined);

  /** The height Manual returns to. Recorded by an effect, not `linkedSignal`, which is lazy and would first read after the height is gone. */
  protected readonly lastManualHeight = signal(ROW_HEIGHT_MANUAL_DEFAULT);

  constructor() {
    effect(() => {
      const height = this.rowHeight();
      if (height !== undefined) {
        this.lastManualHeight.set(height);
      }
    });
  }

  protected readonly rowHeightLabel = computed(() => {
    const height = this.rowHeight();
    return height === undefined
      ? this._translate.instant('pages.dataBrowser.viewOptions.rowHeightAuto')
      : `${height}px`;
  });

  protected onControlKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      event.stopPropagation();
    }
  }

  protected onModeChange(mode: 'auto' | 'manual'): void {
    this.rowHeightChanged.emit(mode === 'auto' ? undefined : this.lastManualHeight());
  }

  /** `input` rather than `valueChange`, so the table follows the thumb during a drag. */
  protected onSliderInput(event: Event): void {
    const height = Number((event.target as HTMLInputElement).value);
    if (height !== this.rowHeight()) {
      this.rowHeightChanged.emit(height);
    }
  }
}
