import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { FootnoteService } from './footnotes/footnote.service';

@Component({
  selector: 'app-property-values-with-footnotes',
  template: `
    @if (resource.type) {
      <app-property-values [myProperty]="prop" [editModeData]="{ resource, values: prop.values }" />
    }

    @if (footnoteService.footnotes.length > 0) {
      <app-footnotes />
    }
  `,
  styles: [':host { display: block; position: relative; width: 100%}'],
  providers: [FootnoteService],
  standalone: false,
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
