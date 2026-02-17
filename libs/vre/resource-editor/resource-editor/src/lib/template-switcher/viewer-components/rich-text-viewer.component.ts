import { Component, Input } from '@angular/core';
import { ReadTextValueAsXml } from '@dasch-swiss/dsp-js';
import { AddTargetBlankPipe, InternalLinkReplacerPipe } from '@dasch-swiss/vre/ui/ui';
import { FootnoteParserPipe } from '../../resource-properties/footnotes/footnote-parser.pipe';
import { FootnoteDirective } from '../../resource-properties/footnotes/footnote.directive';
import { FootnoteService } from '../../resource-properties/footnotes/footnote.service';

@Component({
  selector: 'app-rich-text-viewer',
  imports: [FootnoteParserPipe, InternalLinkReplacerPipe, AddTargetBlankPipe, FootnoteDirective],
  template: `
    <div
      data-cy="rich-text-switch"
      class="rich-text-viewer"
      [innerHTML]="
        value.strval || '' | footnoteParser: footnoteService.reloadToken() | internalLinkReplacer | addTargetBlank
      "
      appFootnote></div>
  `,
  styles: [
    `
      .rich-text-viewer {
        overflow-wrap: break-word;
        word-break: break-word;

        ::ng-deep * {
          &:first-child {
            margin-top: 0;
          }

          &:last-child {
            margin-bottom: 0;
          }

          footnote {
            color: #336790;
            vertical-align: super;
            font-size: x-small;
            cursor: pointer;
          }
        }
      }
    `,
  ],
})
export class RichTextViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsXml;

  constructor(public readonly footnoteService: FootnoteService) {}
}
