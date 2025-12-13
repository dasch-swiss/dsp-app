import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, OnChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PropertiesDisplayService } from '../resource-properties/properties-display.service';

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
          [matTooltip]="
            _translateService.instant(
              (showAllComments$ | async)
                ? 'resourceEditor.propertiesDisplay.hideComments'
                : 'resourceEditor.propertiesDisplay.showAllComments'
            )
          "
          matTooltipPosition="above"
          (click)="toggleShowAllComments()">
          <mat-icon>comment</mat-icon>
          {{
            (showAllComments$ | async)
              ? ('resourceEditor.propertiesDisplay.hideComments' | translate)
              : ('resourceEditor.propertiesDisplay.showAllComments' | translate)
          }}
        </button>
      } @else {
        <button
          mat-icon-button
          color="primary"
          class="toggle-props"
          data-cy="show-all-comments"
          [matTooltip]="
            _translateService.instant(
              (showAllComments$ | async)
                ? 'resourceEditor.propertiesDisplay.hideComments'
                : 'resourceEditor.propertiesDisplay.showAllComments'
            )
          "
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
          _translateService.instant(
            (propertiesDisplayService.showAllProperties$ | async)
              ? 'resourceEditor.propertiesDisplay.hideEmptyProperties'
              : 'resourceEditor.propertiesDisplay.showAllProperties'
          )
        "
        matTooltipPosition="above"
        (click)="toggleShowAllProps()">
        <mat-icon>unfold_more</mat-icon>
        {{
          (propertiesDisplayService.showAllProperties$ | async)
            ? ('resourceEditor.propertiesDisplay.hideEmptyProperties' | translate)
            : ('resourceEditor.propertiesDisplay.showAllProperties' | translate)
        }}
      </button>
    } @else {
      <button
        mat-icon-button
        color="primary"
        class="toggle-props"
        data-cy="show-all-properties"
        [matTooltip]="
          _translateService.instant(
            (propertiesDisplayService.showAllProperties$ | async)
              ? 'resourceEditor.propertiesDisplay.hideEmptyProperties'
              : 'resourceEditor.propertiesDisplay.showAllProperties'
          )
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
  imports: [AsyncPipe, MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
})
export class PropertiesToggleComponent implements OnChanges {
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input() displayIconsOnly = false;
  numberOfComments!: number;
  showAllComments$ = this.propertiesDisplayService.showComments$;

  readonly _translateService = inject(TranslateService);

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
