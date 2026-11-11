import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { TableColumns } from './table-columns';

/**
 * "View options": shows or hides each column of a table but the first, as the Data tab's table does. Other options of
 * the table are projected under the columns.
 */
@Component({
  selector: 'app-columns-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatCheckbox, MatIcon, MatMenu, MatMenuTrigger, TranslatePipe],
  template: `
    @let v = 'pages.dataBrowser.viewOptions';
    <button
      mat-button
      type="button"
      class="view-options"
      [attr.data-cy]="cyPrefix() + '-view-options'"
      [matMenuTriggerFor]="menu">
      <mat-icon>tune</mat-icon>
      {{ v + '.title' | translate }}
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <!-- The menu stays open while columns are ticked, and only Escape closes it from the keyboard. -->
      <div
        class="menu"
        (click)="$event.stopPropagation()"
        (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
        <span class="head">
          <span class="heading">{{ v + '.columns' | translate }}</span>
          <button mat-button type="button" class="all" (click)="columns().showAll(!columns().allShown())">
            {{ (columns().allShown() ? v + '.hideAllShort' : v + '.showAllShort') | translate }}
          </button>
        </span>
        @for (column of columns().order().slice(1); track column) {
          <mat-checkbox
            [attr.data-cy]="cyPrefix() + '-show-' + column"
            [checked]="!columns().hidden().includes(column)"
            (change)="columns().show(column, $event.checked)">
            {{ labels()[column] | translate }}
          </mat-checkbox>
        }
        <ng-content />
      </div>
    </mat-menu>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .view-options {
        height: 36px;
        font-size: 13px;
      }

      .menu {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 200px;
        padding: 4px 12px;
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .heading {
        padding: 4px 0;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .all {
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
      }
    `,
  ],
})
export class ColumnsMenuComponent {
  readonly columns = input.required<TableColumns<string>>();
  /** The translation key of each column's name. */
  readonly labels = input.required<Record<string, string>>();
  readonly cyPrefix = input('data-model');
}
