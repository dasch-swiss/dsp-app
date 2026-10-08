import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { CenteredMessageComponent } from './centered-message.component';

/**
 * Persistent failure state for a search that errored.
 *
 * Deliberately distinct from {@link NoResultsFoundComponent}: an empty result set means the search
 * ran and matched nothing, whereas this means the search never completed. Rendering the empty state
 * on failure tells the user their query legitimately had no matches, which is wrong (DEV-6866).
 */
@Component({
  selector: 'app-search-failed',
  // Announced when it appears: for a query dsp-api rejected, this panel is the only feedback, as the
  // advanced search shows no snackbar for it (DEV-7370).
  host: { role: 'alert' },
  template: `
    <app-centered-message
      [icon]="'error_outline'"
      [title]="'pages.search.searchFailed.title' | translate"
      [message]="reason ?? ('pages.search.searchFailed.message' | translate)" />
    <button mat-stroked-button data-cy="search-failed-retry" (click)="retry.emit()">
      {{ 'ui.common.actions.retry' | translate }}
    </button>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `,
  ],
  imports: [CenteredMessageComponent, MatButtonModule, TranslatePipe],
})
export class SearchFailedComponent {
  /**
   * The server's own explanation, when it gave one worth showing (a rejected query says why it was
   * rejected). Falls back to the generic wording. Not translated — it is dsp-api's text, and the
   * snackbar has always shown it in the same language.
   */
  @Input() reason?: string;

  @Output() retry = new EventEmitter<void>();
}
