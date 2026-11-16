import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestrictionCounts, ValueItemType } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { TranslatePipe } from '@ngx-translate/core';

/** One rendered line of a cell: a unit, its counts, and the label/tooltip naming that unit. */
interface CountLine {
  unit: 'resources' | 'items';
  counts: RestrictionCounts;
  icon: string;
  tooltipKey: string;
}

/**
 * One audience cell of the summary matrix: what that audience cannot fully see.
 *
 * Each line carries two independent states, never added together:
 *
 *   - **hidden** — permission code 0, nothing served; red with `visibility_off`.
 *   - **restrictedView** — code 1, a degraded version served; amber with `blur_on`.
 *
 * **Which unit is shown follows the item-type filter.** The API reports each audience in two units —
 * `resources` (whole restricted resources) and `items` (restricted values inside them) — and the units
 * are never summed: one resource holding three hidden values is 1 resource and 3 items, and adding them
 * to "4" produces rows reading "4 of 1" against a class of one resource.
 *
 * Rendering one fixed unit does not work, because four of the five filters are item-level. Under
 * `Value`, `File` or `Comment` the `resources` unit is structurally zero, so a resources-only cell blanks
 * the entire matrix exactly when the user narrows to what they care about (DEV-6868). So:
 *
 *   - `File` / `Value` / `Comment` → the items line only
 *   - `All` → both lines, each labelled (design 1i)
 *
 * The two units now arrive from two different requests (DEV-6778): resources from step 1, values from
 * step 2. So a cell can be showing a final resources figure while its values figure is still in flight,
 * or has failed for that class alone — hence `valuesLoading` / `valuesFailed`, which affect the items
 * line only. Resource counts are never filtered and never partial.
 *
 * Icons are `aria-hidden` because the numbers beside them are the content; the cell carries one
 * `aria-label` naming the units and states in words, so colour is never the only channel. Sighted
 * readers get the same in the page's legend, which repeats these glyphs and spells out each state —
 * the two states are not explained per figure, so a matrix of them stays readable.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-count-cell',
  template: `
    <span class="col-aud count" [attr.aria-label]="ariaLabel | translate: ariaParams">
      @if (valuesLoading && lines.length === 0) {
        <span class="count-pending" aria-hidden="true">…</span>
      } @else if (valuesFailed && lines.length === 0) {
        <span class="count-failed" aria-hidden="true">?</span>
      } @else if (lines.length === 0) {
        <span class="count-none" aria-hidden="true">–</span>
      } @else {
        @for (line of lines; track line.unit) {
          <span class="count-line">
            @if (showUnitIcon) {
              <mat-icon class="unit-icon" aria-hidden="true" [matTooltip]="line.tooltipKey | translate">{{
                line.icon
              }}</mat-icon>
            }
            @if (line.counts.hidden) {
              <span class="count-hidden">
                <mat-icon aria-hidden="true">visibility_off</mat-icon>
                {{ line.counts.hidden }}
              </span>
            }
            @if (line.counts.restrictedView) {
              <span class="count-restricted">
                <mat-icon aria-hidden="true">blur_on</mat-icon>
                {{ line.counts.restrictedView }}
              </span>
            }
          </span>
        }
      }
    </span>
  `,
  styleUrl: './count-cell.component.scss',
  imports: [MatIcon, MatTooltipModule, TranslatePipe],
})
export class CountCellComponent {
  /** This audience's whole-resource figure, from step 1. Always final — never filtered, never partial. */
  @Input({ required: true }) resourceCounts: RestrictionCounts | undefined;

  /** This audience's value figure, from step 2. Undefined while that class is still loading or failed. */
  @Input() valueCounts: RestrictionCounts | undefined;

  /** Step 2 still in flight for this row. */
  @Input() valuesLoading = false;

  /** Step 2 failed for this row alone — the other rows are unaffected. */
  @Input() valuesFailed = false;

  /** The active item-type filter — decides which unit(s) this cell answers with. */
  @Input() itemType: ValueItemType = ValueItemType.All;

  /** Only in the combined view does a line need to say which unit it counts. */
  get showUnitIcon(): boolean {
    return this.itemType === ValueItemType.All;
  }

  /** The lines to render: the units in scope for the filter that have something to report. */
  get lines(): CountLine[] {
    // Resource counts are unfiltered, so showing them beside a value figure narrowed to Comment would
    // put two differently-scoped numbers in one cell. Only the combined view shows both.
    const wanted: Array<'resources' | 'items'> =
      this.itemType === ValueItemType.All ? ['resources', 'items'] : ['items'];

    return wanted
      .map(unit => ({
        unit,
        counts: unit === 'resources' ? this.resourceCounts : this.valueCounts,
        icon: unit === 'resources' ? 'description' : 'label',
        tooltipKey:
          unit === 'resources'
            ? 'pages.project.viewRestrictions.resourceUnit'
            : 'pages.project.viewRestrictions.itemUnit',
      }))
      .filter((l): l is CountLine => !!l.counts && (!!l.counts.hidden || !!l.counts.restrictedView));
  }

  /**
   * A single spoken label per cell, so a screen reader announces the units and states in words rather
   * than bare numbers whose meaning lives in icon colour and row position.
   */
  get ariaLabel(): string {
    return this.lines.length === 0
      ? 'pages.project.viewRestrictions.countNone'
      : 'pages.project.viewRestrictions.countAria';
  }

  get ariaParams(): {
    resourcesHidden: number;
    resourcesRestricted: number;
    itemsHidden: number;
    itemsRestricted: number;
  } {
    const find = (unit: 'resources' | 'items') => this.lines.find(l => l.unit === unit)?.counts;
    return {
      resourcesHidden: find('resources')?.hidden ?? 0,
      resourcesRestricted: find('resources')?.restrictedView ?? 0,
      itemsHidden: find('items')?.hidden ?? 0,
      itemsRestricted: find('items')?.restrictedView ?? 0,
    };
  }
}
