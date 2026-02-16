import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { unescapeHtml } from '@dasch-swiss/vre/ui/ui';
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
})
export class PropertyValuesWithFootnotesComponent implements OnChanges {
  @Input({ required: true }) prop!: PropertyInfoValues;
  @Input({ required: true }) resource!: ReadResource;

  constructor(
    public readonly footnoteService: FootnoteService,
    private readonly _sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prop']) {
      this.footnoteService.reset();
      this._registerAllFootnotes();
    }
  }

  private _registerAllFootnotes() {
    this.prop.values.forEach((value, valueIndex) => {
      if (value.strval === undefined) return;
      const matches = value.strval.matchAll(FootnoteService.FOOTNOTE_REGEXP);

      Array.from(matches).forEach((match, indexFootnote) => {
        this.footnoteService.addFootnote(
          valueIndex,
          indexFootnote,
          this._sanitizer.bypassSecurityTrustHtml(unescapeHtml(match[1]))
        );
      });
    });
  }
}
