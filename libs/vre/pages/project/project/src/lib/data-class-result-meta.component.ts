import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';

/** The result range and a compact inline pager; deliberately separate from the shared boxed `PagerComponent`. */
@Component({
  selector: 'app-data-class-result-meta',
  template: `
    @let meta = vm();
    <!-- aria-live: filtering changes these numbers without moving focus. -->
    <div class="result-meta" aria-live="polite" [class.is-refreshing]="meta.refreshing">
      @if (meta.countUnavailable) {
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
              [disabled]="meta.atFirst || meta.refreshing"
              (click)="goTo(0)">
              <mat-icon>first_page</mat-icon>
            </button>
            <button
              mat-icon-button
              type="button"
              class="pager-button"
              [matTooltip]="'ui.pager.previousPage' | translate"
              [attr.aria-label]="'ui.pager.previousPage' | translate"
              [disabled]="meta.atFirst || meta.refreshing"
              (click)="goTo(meta.pageIndex - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>

            <!-- Applied on Enter, not per keystroke; blur restores the current page. -->
            <span class="page-indicator">
              <input
                #pageInput
                type="number"
                class="page-input"
                data-cy="page-input"
                min="1"
                [max]="meta.lastPageIndex + 1"
                [value]="meta.pageIndex + 1"
                [disabled]="meta.refreshing"
                [style.--page-digits]="(meta.lastPageIndex + 1).toString().length"
                [attr.aria-label]="'pages.dataBrowser.resultMeta.pageNumber' | translate"
                [matTooltip]="'pages.dataBrowser.resultMeta.pageNumberHint' | translate"
                (focus)="pageInput.select()"
                (keydown.enter)="onPageEntered(pageInput, meta.pageIndex, meta.lastPageIndex)"
                (blur)="pageInput.value = (meta.pageIndex + 1).toString()" />
              {{ 'pages.dataBrowser.resultMeta.ofPages' | translate: { total: meta.lastPageIndex + 1 } }}
            </span>

            <button
              mat-icon-button
              type="button"
              class="pager-button"
              data-testid="next-page"
              [matTooltip]="'ui.common.actions.next' | translate"
              [attr.aria-label]="'ui.common.actions.next' | translate"
              [disabled]="meta.atLast || meta.refreshing"
              (click)="goTo(meta.pageIndex + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button
              mat-icon-button
              type="button"
              class="pager-button"
              [matTooltip]="'ui.pager.lastPage' | translate"
              [attr.aria-label]="'ui.pager.lastPage' | translate"
              [disabled]="meta.atLast || meta.refreshing"
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

  private readonly _pageIndex = toSignal(this._resourceResult.pageIndex$, { initialValue: 0 });

  readonly vm = computed(() => {
    const total = this._resourceResult.numberOfResults;
    const pageSize = this._resourceResult.MAX_RESULTS_PER_PAGE;
    const pageIndex = this._pageIndex();

    if (total === null) {
      return { countUnavailable: true as const, refreshing: false };
    }

    const lastPageIndex = total ? Math.ceil(total / pageSize) - 1 : 0;
    return {
      countUnavailable: false as const,
      total,
      pageIndex,
      lastPageIndex,
      // Empty result set reads `0 – 0 of 0`, not `1 – 0 of 0`.
      rangeStart: total ? pageIndex * pageSize + 1 : 0,
      rangeEnd: Math.min((pageIndex + 1) * pageSize, total),
      hasPages: total > pageSize,
      atFirst: pageIndex === 0,
      atLast: pageIndex === lastPageIndex,
      refreshing: this._resourceResult.isRefreshing(),
    };
  });

  goTo(pageIndex: number): void {
    this._resourceResult.updatePageIndex(pageIndex);
  }

  /** Go to the typed page, clamped into range; a non-number restores the current page. */
  onPageEntered(input: HTMLInputElement, pageIndex: number, lastPageIndex: number): void {
    const typed = parseInt(input.value, 10);
    if (Number.isNaN(typed)) {
      input.value = (pageIndex + 1).toString();
      return;
    }

    const page = Math.min(Math.max(typed, 1), lastPageIndex + 1);
    input.value = page.toString();
    if (page - 1 !== pageIndex) {
      this.goTo(page - 1);
    }
  }
}
