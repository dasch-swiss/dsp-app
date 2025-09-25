import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from './properties-display.service';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-display-comment',
  template: ` @if ((propertiesDisplayService.showComments$ | async) && comment) {
    <div
      data-cy="property-value-comment"
      style=" font-size: small; margin-bottom: 16px"
      [innerHTML]="comment | withBreaks"></div>
  }`,
  styleUrls: [`./property-value-display-comment.component.scss`],
  standalone: false,
})
export class PropertyValueDisplayCommentComponent {
  @Input({ required: true }) index!: number;

  get comment() {
    return this.propertyValueService.editModeData.values[this.index].valueHasComment;
  }

  constructor(
    public propertiesDisplayService: PropertiesDisplayService,
    public propertyValueService: PropertyValueService
  ) {}
}
