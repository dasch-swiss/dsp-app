import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-advanced-search-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule, RouterLink],
  template: `
    <div style="display: flex; align-items: center; gap: 8px">
      <h2 style="flex: 1">Advanced search</h2>
      @if (isVerticalDirection !== undefined) {
        <button
          mat-icon-button
          (click)="toggleDirection.emit()"
          data-faro-user-action-name="advanced-search-toggle-layout-button"
          [matTooltip]="isVertical ? 'Switch to horizontal layout' : 'Switch to vertical layout'">
          <mat-icon style="color: #646465">{{ isVertical ? 'vertical_split' : 'horizontal_split' }}</mat-icon>
        </button>
      }
      <a mat-stroked-button [routerLink]="['..', 'search']">
        <mat-icon>swap_horiz</mat-icon>
        Switch to Fulltext search
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchHeaderComponent {
  @Input({ required: true }) isVerticalDirection: boolean | undefined;
  @Output() toggleDirection = new EventEmitter<any>();

  get isVertical() {
    return this.isVerticalDirection === true;
  }
}
