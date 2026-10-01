import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { DataClassUrlStateService } from './data-class-url-state.service';

/**
 * The sortable `LABEL` column header, above the scrolling list.
 *
 * Label is the Data tab's only sortable field, so this is a single two-state toggle rather than a
 * column-picker: ascending by default, descending once, back again. The direction lives in the URL
 * as a bare `orderDir=desc`, which means it survives reload and back-navigation.
 *
 * Returning to page 0 is not done here. Changing the sort changes the query, and the fetcher already
 * resets the offset whenever the query changes — doing it again here would be a second writer to the
 * same state with no way to tell which one won.
 */
@Component({
  selector: 'app-data-class-label-header',
  template: `
    @let descending = sortDescending$ | async;
    <!-- role/aria-sort on the wrapper, not the button: aria-sort belongs on the header cell, and a
         button cannot carry it meaningfully. -->
    <div role="columnheader" [attr.aria-sort]="descending ? 'descending' : 'ascending'" class="label-header">
      <button
        type="button"
        class="sort-toggle"
        data-cy="label-sort-toggle"
        [attr.aria-label]="
          (descending ? 'pages.dataBrowser.labelHeader.sortAscending' : 'pages.dataBrowser.labelHeader.sortDescending')
            | translate
        "
        (click)="toggle(!descending)">
        <span class="label-text">{{ 'pages.dataBrowser.labelHeader.label' | translate }}</span>
        <mat-icon class="sort-icon">{{ descending ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
        <span class="direction">
          {{ (descending ? 'pages.dataBrowser.labelHeader.zToA' : 'pages.dataBrowser.labelHeader.aToZ') | translate }}
        </span>
      </button>
    </div>
  `,
  styleUrl: './data-class-label-header.component.scss',
  imports: [AsyncPipe, MatIcon, TranslatePipe],
})
export class DataClassLabelHeaderComponent {
  /**
   * `null` would make the template treat "not yet known" as ascending, which is also the default, so
   * the coercion is safe here — but it is spelled out rather than left to the async pipe so the
   * intent survives a later change to the source.
   */
  readonly sortDescending$ = this._urlState.sortDescending$.pipe(map(Boolean));

  constructor(private readonly _urlState: DataClassUrlStateService) {}

  toggle(descending: boolean): void {
    this._urlState.setSortDescending(descending);
  }
}
