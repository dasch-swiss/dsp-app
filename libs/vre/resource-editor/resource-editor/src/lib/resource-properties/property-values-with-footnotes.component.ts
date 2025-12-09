import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { FootnoteService } from './footnotes/footnote.service';
import { FootnotesComponent } from './footnotes/footnotes.component';
import { PropertyValuesComponent } from './property-values.component';

@Component({
  selector: 'app-property-values-with-footnotes',
  imports: [PropertyValuesComponent, FootnotesComponent],
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
  standalone: true,
})
export class PropertyValuesWithFootnotesComponent implements OnChanges {
  @Input({ required: true }) prop!: PropertyInfoValues;
  @Input({ required: true }) resource!: ReadResource;

  constructor(public readonly footnoteService: FootnoteService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prop']) {
      this.footnoteService.reset();
    }
  }
}
