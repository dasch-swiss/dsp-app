import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Row 3 of the class header: the result range, then a compact pager.
 *
 * Deliberately *not* the shared `PagerComponent`. That one is a bordered, rounded card with an
 * editable page-number input, and it is what the two Search pages render — this design is an
 * inline meta line with a static `1 of 4` indicator and no box. Adding a variant flag to the shared
 * pager would put two visual languages and two interaction models in one component; the Search
 * pages keep theirs untouched.
 */
@Component({
  selector: 'app-data-class-result-meta',
  template: `
    @let meta = vm();
    <!-- Announced, not just rendered: filtering changes these numbers without moving focus. -->
    <div class="result-meta" aria-live="polite">
      @if (meta.countUnavailable) {
        <!-- The count query failed. The pager cannot be sized either, so paging is unavailable
             until the next successful load. -->
        <span class="range" data-cy="count-unavailable">
          {{ 'pages.dataBrowser.resourcesList.countUnavailable' | translate }}
        </span>
      } @else {
        <span class="range" data-cy="result-range">
          {{
            'pages.dataBrowser.resultMeta.range'
              | translate: { start: meta.rangeStart, end: meta.rangeEnd, total: meta.total }
          }}
        </span>

        @if (meta.hasPages) {
          <div class="pager" data-cy="result-pager">
            <button
              mat-icon-button
              type="button"
              class="pager-button"
              [matTooltip]="'ui.pager.firstPage' | translate"
              [attr.aria-label]="'ui.pager.firstPage' | translate"
              [disabled]="meta.atFirst"
              (click)="goTo(0)">
              <mat-icon>first_page</mat-icon>
            </button>
            <button
              mat-icon-button
              type="button"
              class="pager-button"
              [matTooltip]="'ui.pager.previousPage' | translate"
              [attr.aria-label]="'ui.pager.previousPage' | translate"
              [disabled]="meta.atFirst"
              (click)="goTo(meta.pageIndex - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>

            <span class="page-indicator">
              {{
                'pages.dataBrowser.resultMeta.pageOf'
                  | translate: { current: meta.pageIndex + 1, total: meta.lastPageIndex + 1 }
              }}
            </span>

            <button
              mat-icon-button
              type="button"
              class="pager-button"
              data-testid="next-page"
              [matTooltip]="'ui.common.actions.next' | translate"
              [attr.aria-label]="'ui.common.actions.next' | translate"
              [disabled]="meta.atLast"
              (click)="goTo(meta.pageIndex + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button
              mat-icon-button
              type="button"
              class="pager-button"
              [matTooltip]="'ui.pager.lastPage' | translate"
              [attr.aria-label]="'ui.pager.lastPage' | translate"
              [disabled]="meta.atLast"
              (click)="goTo(meta.lastPageIndex)">
              <mat-icon>last_page</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './data-class-result-meta.component.scss',
  imports: [MatIcon, MatIconButton, MatTooltip, TranslatePipe],
})
export class DataClassResultMetaComponent {
  private readonly _resourceResult = inject(ResourceResultService);

  /**
   * The page index is an observable and the total a signal, so the two are joined here rather than
   * in the template — the range needs both, and reading `numberOfResults` inside `computed` picks
   * up its signal dependency through the service's plain-property accessor.
   */
  private readonly _pageIndex = toSignal(this._resourceResult.pageIndex$, { initialValue: 0 });

  readonly vm = computed(() => {
    const total = this._resourceResult.numberOfResults;
    const pageSize = this._resourceResult.MAX_RESULTS_PER_PAGE;
    const pageIndex = this._pageIndex();

    if (total === null) {
      return { countUnavailable: true as const };
    }

    const lastPageIndex = total ? Math.ceil(total / pageSize) - 1 : 0;
    return {
      countUnavailable: false as const,
      total,
      pageIndex,
      lastPageIndex,
      // `total` rather than the rendered row count: on the last page the range end is the total, and
      // on an empty result set the range reads `0 – 0 of 0` rather than `1 – 0 of 0`.
      rangeStart: total ? pageIndex * pageSize + 1 : 0,
      rangeEnd: Math.min((pageIndex + 1) * pageSize, total),
      hasPages: total > pageSize,
      atFirst: pageIndex === 0,
      atLast: pageIndex === lastPageIndex,
    };
  });

  goTo(pageIndex: number): void {
    this._resourceResult.updatePageIndex(pageIndex);
  }
}
