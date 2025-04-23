import { Component } from '@angular/core';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FootnoteService } from './footnote.service';

@Component({
  selector: 'app-footnotes',
  template: `<h5>{{ 'resourceEditor.resourceProperties.footnotes' | translate }}</h5>
    <div
      *ngFor="let footnote of footnoteService.footnotes; let index = index; trackBy: trackByIndex"
      class="footnote"
      [attr.data-uuid]="footnote.uuid"
      data-cy="footnote">
      <a (click)="goToFootnote(footnote.uuid)">{{ index + 1 }}.</a>
      <span class="footnote-value" [innerHTML]="footnote.content | internalLinkReplacer | addTargetBlank"></span>
    </div>`,
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
    const element = document.getElementById(uuid);
    if (!element) {
      throw new AppError(`Element with uid ${uuid} is not found on page.`);
    }

    const yOffset = -80;
    const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  trackByIndex(index: number) {
    return index;
  }
}
