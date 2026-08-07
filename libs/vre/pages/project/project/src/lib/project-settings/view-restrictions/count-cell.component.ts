import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RestrictionCounts } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { TranslatePipe } from '@ngx-translate/core';

/** The nested form: the two units, each with its own pair of states. */
interface NestedCounts {
  resources?: RestrictionCounts;
  items?: RestrictionCounts;
}

/**
 * One audience's figure as it actually arrives. The API is not consistent: `totals` is flat, while
 * `groups[].counts` is still nested, so every consumer has to cope with both.
 */
export type AudienceCount = RestrictionCounts | NestedCounts;

const isNested = (value: AudienceCount): value is NestedCounts => 'resources' in value || 'items' in value;

/**
 * Collapse either shape to a single pair of state counts.
 *
 * A nested payload is summed across its units — one resource holding three hidden values reports 4 hidden.
 * That conflates two different questions, and the split form answered them separately, but the deployed API
 * no longer sends the split consistently and a summed figure beats a blank cell.
 */
export function normaliseCounts(value: AudienceCount | undefined): RestrictionCounts | undefined {
  if (!value) {
    return undefined;
  }
  if (!isNested(value)) {
    return value;
  }
  return {
    hidden: (value.resources?.hidden ?? 0) + (value.items?.hidden ?? 0),
    restrictedView: (value.resources?.restrictedView ?? 0) + (value.items?.restrictedView ?? 0),
  };
}

/**
 * One audience cell of the summary matrix: what that audience cannot fully see.
 *
 * A single count per state, shown side by side on one line:
 *
 *   - **hidden** — permission code 0, nothing served; red with `visibility_off`.
 *   - **restrictedView** — code 1, a degraded version served; amber with `blur_on`.
 *
 * The two states are distinct outcomes, not degrees of one, so they are never added together. A state
 * with a zero count renders nothing; a cell with neither renders a single dash.
 *
 * Icons are `aria-hidden` because the numbers beside them are the content; the cell carries one
 * `aria-label` naming both states, so colour is never the only channel.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-count-cell',
  template: `
    <span class="col-aud count" [attr.aria-label]="ariaLabel | translate: ariaParams">
      @if (isEmpty) {
        <span class="count-none" aria-hidden="true">–</span>
      } @else {
        @if (counts!.hidden) {
          <span class="count-hidden">
            <mat-icon aria-hidden="true">visibility_off</mat-icon>
            {{ counts!.hidden }}
          </span>
        }
        @if (counts!.restrictedView) {
          <span class="count-restricted">
            <mat-icon aria-hidden="true">blur_on</mat-icon>
            {{ counts!.restrictedView }}
          </span>
        }
      }
    </span>
  `,
  styleUrl: './count-cell.component.scss',
  imports: [MatIcon, TranslatePipe],
})
export class CountCellComponent {
  /**
   * Accepts either shape the API emits, because it is not consistent between them: `totals` arrives flat
   * as `{hidden, restrictedView}`, while `groups[].counts` still nests the figures under `resources` and
   * `items`. Reading only one shape left the other rendering a dash over live data, so both are read here
   * rather than in each call site. A nested payload is collapsed by summing the two units per state.
   */
  @Input({ required: true }) set counts(value: AudienceCount | undefined) {
    this._counts = normaliseCounts(value);
  }

  get counts(): RestrictionCounts | undefined {
    return this._counts;
  }

  private _counts: RestrictionCounts | undefined;

  get isEmpty(): boolean {
    return !this.counts?.hidden && !this.counts?.restrictedView;
  }

  /**
   * A single spoken label per cell, so a screen reader announces the states in words rather than two
   * bare numbers whose meaning lives in icon colour and row position.
   */
  get ariaLabel(): string {
    return this.isEmpty ? 'pages.project.viewRestrictions.countNone' : 'pages.project.viewRestrictions.countAria';
  }

  get ariaParams(): { hidden: number; restricted: number } {
    return {
      hidden: this.counts?.hidden ?? 0,
      restricted: this.counts?.restrictedView ?? 0,
    };
  }
}
