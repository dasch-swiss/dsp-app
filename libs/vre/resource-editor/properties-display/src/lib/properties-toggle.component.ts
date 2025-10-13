import { Component, Input, OnChanges } from '@angular/core';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-properties-toggle',
  template: `
    @if (numberOfComments > 0) {
      @if (!displayIconsOnly) {
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
      } @else {
        <button
          mat-icon-button
          color="primary"
          class="toggle-props"
          data-cy="show-all-comments"
          [matTooltip]="((showAllComments$ | async) ? 'Hide' : 'Show all') + ' comments'"
          matTooltipPosition="above"
          (click)="toggleShowAllComments()">
          <mat-icon>comment</mat-icon>
        </button>
      }
    }
    @if (!displayIconsOnly) {
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
        color="primary"
        class="toggle-props"
        data-cy="show-all-properties"
        [matTooltip]="
          ((propertiesDisplayService.showAllProperties$ | async) ? 'Hide empty' : 'Show all') + ' properties'
        "
        matTooltipPosition="above"
        (click)="toggleShowAllProps()">
        <mat-icon>unfold_more</mat-icon>
      </button>
    }
  `,
  styles: [
    'button { padding-top: 24px; padding-bottom: 24px} :host { display: flex; flex-direction: row-reverse; gap: 16px; background: #eaeff3;}',
  ],
  standalone: false,
})
export class PropertiesToggleComponent implements OnChanges {
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input() displayIconsOnly = false;
  numberOfComments!: number;
  showAllComments$ = this.propertiesDisplayService.showComments$;

  constructor(public readonly propertiesDisplayService: PropertiesDisplayService) {}

  ngOnChanges() {
    this.numberOfComments = this.properties.reduce((acc, prop) => {
      const valuesWithComments = prop.values.reduce(
        (_acc, value) => _acc + (value.valueHasComment === undefined ? 0 : 1),
        0
      );
      return acc + valuesWithComments;
    }, 0);
  }

  toggleShowAllProps() {
    this.propertiesDisplayService.toggleShowProperties();
  }

  toggleShowAllComments() {
    this.propertiesDisplayService.toggleShowComments();
  }
}
