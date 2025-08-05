import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';

@Component({
  selector: 'app-properties-toolbar',
  template: `
    <ng-container *ngIf="!showOnlyIcons; else commentsIconTpl">
      <button
        *ngIf="numberOfComments > 0"
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
    </ng-container>

    <ng-container *ngIf="showToggleProperties">
      <button
        mat-button
        color="primary"
        class="toggle-props"
        data-cy="show-all-properties"
        *ngIf="!showOnlyIcons; else showPropsIconTpl"
        [matTooltip]="
          ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
        "
        matTooltipPosition="above"
        (click)="toggleShowAllProps()">
        <mat-icon>unfold_more</mat-icon>
        {{ (propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all' }} properties
      </button>
    </ng-container>

    <ng-template #commentsIconTpl>
      <button
        style="color: rgb(51, 103, 144)"
        mat-icon-button
        *ngIf="numberOfComments > 0"
        [matTooltip]="((showAllComments$ | async) ? 'Hide' : 'Show all') + ' comments'"
        matTooltipPosition="above"
        (click)="toggleShowAllComments()">
        <mat-icon>{{ (showAllComments$ | async) ? 'comments_disabled' : 'comment' }}</mat-icon>
      </button>
    </ng-template>
    <ng-template #showPropsIconTpl>
      <button
        mat-icon-button
        style="color: rgb(51, 103, 144)"
        [matTooltip]="
          ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
        "
        matTooltipPosition="above"
        (click)="toggleShowAllProps()">
        <mat-icon>{{ (propertiesDisplayService.showAllProperties$ | async) ? 'unfold_less' : 'unfold_more' }}</mat-icon>
      </button>
    </ng-template>
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
