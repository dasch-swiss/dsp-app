import { Component, Input } from '@angular/core';
import { PropertiesDisplayService } from './properties-display.service';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-display-comment',
  template: ` <div
    *ngIf="
      (propertiesDisplayService.showComments$ | async) &&
      propertyValueService.editModeData.values[index].valueHasComment as comment
    "
    data-cy="property-value-comment"
    style=" font-size: small; margin-bottom: 16px">
    {{ comment }}
  </div>`,
  styleUrls: [`./property-value-display-comment.component.scss`],
})
export class PropertyValueDisplayCommentComponent {
  @Input({ required: true }) index!: number;

  constructor(
    public propertiesDisplayService: PropertiesDisplayService,
    public propertyValueService: PropertyValueService
  ) {}
}
