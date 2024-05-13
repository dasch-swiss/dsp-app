import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from './properties-display.service';

@Component({
  selector: 'app-properties-toolbar',
  template: `
    <button
      mat-button
      *ngIf="!showOnlyIcons; else commentsIconTpl"
      color="primary"
      class="toggle-props"
      [matTooltip]="((showAllComments$ | async) ? 'Hide' : 'Show all') + ' comments'"
      matTooltipPosition="above"
      (click)="toggleShowAllComments()">
      <mat-icon>{{ (showAllComments$ | async) ? 'comments_disabled' : 'comment' }}</mat-icon>
      {{ (showAllComments$ | async) ? 'Hide' : 'Show all' }} comments
    </button>

    <ng-container *ngIf="showToggleProperties">
      <button
        mat-button
        color="primary"
        class="toggle-props"
        *ngIf="!showOnlyIcons; else showPropsIconTpl"
        [matTooltip]="
          ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
        "
        matTooltipPosition="above"
        (click)="toggleShowAllProps()">
        <mat-icon>{{ (propertiesDisplayService.showAllProperties$ | async) ? 'unfold_less' : 'unfold_more' }}</mat-icon>
        {{ (propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all' }} properties
      </button>
    </ng-container>

    <ng-template #commentsIconTpl>
      <button
        style="color: rgb(51, 103, 144)"
        mat-icon-button
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
      </button></ng-template
    >
  `,
  styles: ['button { padding-top: 24px; padding-bottom: 24px}'],
})
export class PropertiesToolbarComponent {
  @Input({ required: true }) showToggleProperties!: boolean;
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
