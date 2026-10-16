import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DataClassUrlStateService, DataClassView } from './data-class-url-state.service';

/**
 * Switches the result page between the list and the table.
 *
 * Two underline tabs rather than a segmented button or a menu: the choice is binary, both options
 * stay visible, and the active one is legible at a glance from across the row — which a menu whose
 * label you have to read is not.
 *
 * The choice lives in the URL, so it survives reload, answers to Back and travels in a shared link.
 * It is kept out of `hasActiveState$`, so it never lights the Reset control: it narrows nothing.
 */
@Component({
  selector: 'app-data-class-view-toggle',
  template: `
    @let current = view();

    <div class="view-toggle" role="group" [attr.aria-label]="'pages.dataBrowser.viewToggle.label' | translate">
      <button
        type="button"
        class="view-tab"
        data-cy="view-toggle-list"
        [class.is-active]="current === 'list'"
        [attr.aria-pressed]="current === 'list'"
        (click)="select('list')">
        <mat-icon>view_list</mat-icon>
        {{ 'pages.dataBrowser.viewToggle.list' | translate }}
      </button>

      <button
        type="button"
        class="view-tab"
        data-cy="view-toggle-table"
        [class.is-active]="current === 'table'"
        [attr.aria-pressed]="current === 'table'"
        (click)="select('table')">
        <mat-icon>table_chart</mat-icon>
        {{ 'pages.dataBrowser.viewToggle.table' | translate }}
      </button>
    </div>
  `,
  styleUrl: './data-class-view-toggle.component.scss',
  imports: [MatIcon, TranslatePipe],
})
export class DataClassViewToggleComponent {
  private readonly _urlState = inject(DataClassUrlStateService);

  readonly view = toSignal(this._urlState.view$, { initialValue: 'list' as DataClassView });

  /**
   * Re-selecting the current view writes nothing. `setView` pushes a history entry, and clicking
   * the tab you are already on should not give Back something to undo.
   */
  select(view: DataClassView): void {
    if (view !== this.view()) {
      this._urlState.setView(view);
    }
  }
}
