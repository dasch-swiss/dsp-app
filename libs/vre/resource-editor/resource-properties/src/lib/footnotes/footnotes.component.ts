import { Component } from '@angular/core';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FootnoteService } from './footnote.service';

@Component({
  selector: 'app-footnotes',
  template: `<h5>{{ 'resourceEditor.resourceProperties.footnotes' | translate }}</h5>
    @for (footnote of footnoteService.footnotes; track footnote; let index = $index) {
      <div
        class="footnote"
        [attr.data-uuid]="footnoteService.uuid + '-' + footnote.indexValue + '-' + footnote.indexFootnote"
        data-cy="footnote">
        <a (click)="goToFootnote(footnoteService.uuid + '-' + footnote.indexValue + '-' + footnote.indexFootnote)"
          >{{ index + 1 }}.</a
        >
        <span class="footnote-value" [innerHTML]="footnote.content | internalLinkReplacer | addTargetBlank"></span>
      </div>
    }`,
  styles: [
    `
      .footnote {
        display: flex;
        align-items: flex-start;
        gap: 5px;
        padding: 8px 0;
      }

      .footnote-value::ng-deep {
        & > p:first-of-type {
          margin-top: 0;
        }

        & > p:last-of-type {
          margin-bottom: 0;
        }
      }
    `,
  ],
})
export class FootnotesComponent {
  constructor(public readonly footnoteService: FootnoteService) {}

  goToFootnote(uuid: string) {
    const targetFootnote = document.querySelector(`footnote[data-origin-uuid="${uuid}"]`);

    if (!targetFootnote) {
      throw new AppError(`Element with uid ${uuid} is not found on page.`);
    }
    targetFootnote.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
