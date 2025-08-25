import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PropertiesDisplayService } from './properties-display.service';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-display-comment',
  template: ` <div
    *ngIf="(propertiesDisplayService.showComments$ | async) && commentWithBreaks"
    data-cy="property-value-comment"
    style=" font-size: small; margin-bottom: 16px"
    [innerHTML]="commentWithBreaks"></div>`,
  styleUrls: [`./property-value-display-comment.component.scss`],
})
export class PropertyValueDisplayCommentComponent {
  @Input({ required: true }) index!: number;

  get commentWithBreaks() {
    const comment = this.propertyValueService.editModeData.values[this.index].valueHasComment;
    if (!comment) {
      return null;
    }

    const withBreaks = comment.replace(/\n/g, '<br>');
    return this._sanitizer.bypassSecurityTrustHtml(withBreaks);
  }
  constructor(
    public propertiesDisplayService: PropertiesDisplayService,
    public propertyValueService: PropertyValueService,
    private _sanitizer: DomSanitizer
  ) {}
}
