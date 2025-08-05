import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { FootnoteService } from './footnotes/footnote.service';

@Component({
  selector: 'app-property-values-with-footnotes',
  template: `
    <app-property-values *ngIf="resource.type" [myProperty]="prop" [editModeData]="{ resource, values: prop.values }" />

    <app-footnotes *ngIf="footnoteService.footnotes.length > 0" />
  `,
  styles: [':host { display: block; position: relative; width: 100%}'],
  providers: [FootnoteService],
})
export class PropertyValuesWithFootnotesComponent implements OnChanges {
  @Input({ required: true }) prop!: PropertyInfoValues;
  @Input({ required: true }) resource!: ReadResource;

  constructor(public footnoteService: FootnoteService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prop']) {
      this.footnoteService.reset();
    }
  }
}
