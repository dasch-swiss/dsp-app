import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';

@Component({
  selector: 'app-properties-toolbar',
  template: `
    @if (!showOnlyIcons) {
      @if (numberOfComments > 0) {
        <button
          mat-button
          color="primary"
          class="toggle-props"
          data-cy="show-all-comments"
          [matTooltip]="((showAllComments$ | async) ? 'Hide' : 'Show all') + ' comments'"
          matTooltipPosition="above"
          (click)="toggleShowAllComments()">
          <mat-icon>comment</mat-icon>
          {{ (showAllComments$ | async) ? 'Hide' : 'Show all' }} comments
        </button>
      }
    } @else {
      @if (numberOfComments > 0) {
        <button
          style="color: rgb(51, 103, 144)"
          mat-icon-button
          [matTooltip]="((showAllComments$ | async) ? 'Hide' : 'Show all') + ' comments'"
          matTooltipPosition="above"
          (click)="toggleShowAllComments()">
          <mat-icon>{{ (showAllComments$ | async) ? 'comments_disabled' : 'comment' }}</mat-icon>
        </button>
      }
    }

    @if (showToggleProperties) {
      @if (!showOnlyIcons) {
        <button
          mat-button
          color="primary"
          class="toggle-props"
          data-cy="show-all-properties"
          [matTooltip]="
            ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
          "
          matTooltipPosition="above"
          (click)="toggleShowAllProps()">
          <mat-icon>unfold_more</mat-icon>
          {{ (propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all' }} properties
        </button>
      } @else {
        <button
          mat-icon-button
          style="color: rgb(51, 103, 144)"
          [matTooltip]="
            ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
          "
          matTooltipPosition="above"
          (click)="toggleShowAllProps()">
          <mat-icon>{{
            (propertiesDisplayService.showAllProperties$ | async) ? 'unfold_less' : 'unfold_more'
          }}</mat-icon>
        </button>
      }
    }
  `,
  styles: ['button { padding-top: 24px; padding-bottom: 24px}'],
})
export class PropertiesToolbarComponent {
  @Input({ required: true }) showToggleProperties!: boolean;
  @Input({ required: true }) numberOfComments!: number;
  @Input() showOnlyIcons = false;
  showAllComments$ = this.propertiesDisplayService.showComments$;

  constructor(public propertiesDisplayService: PropertiesDisplayService) {}

  toggleShowAllProps() {
    this.propertiesDisplayService.toggleShowProperties();
  }

  toggleShowAllComments() {
    this.propertiesDisplayService.toggleShowComments();
  }
}
