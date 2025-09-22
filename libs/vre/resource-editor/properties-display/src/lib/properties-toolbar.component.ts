import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';

@Component({
  selector: 'app-properties-toolbar',
  template: `
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

    <button
      mat-button
      color="primary"
      class="toggle-props"
      data-cy="show-all-properties"
      [matTooltip]="((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'"
      matTooltipPosition="above"
      (click)="toggleShowAllProps()">
      <mat-icon>unfold_more</mat-icon>
      {{ (propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all' }} properties
    </button>
  `,
  styles: ['button { padding-top: 24px; padding-bottom: 24px}'],
})
export class PropertiesToolbarComponent {
  @Input({ required: true }) numberOfComments!: number;
  showAllComments$ = this.propertiesDisplayService.showComments$;

  constructor(public propertiesDisplayService: PropertiesDisplayService) {}

  toggleShowAllProps() {
    this.propertiesDisplayService.toggleShowProperties();
  }

  toggleShowAllComments() {
    this.propertiesDisplayService.toggleShowComments();
  }
}
