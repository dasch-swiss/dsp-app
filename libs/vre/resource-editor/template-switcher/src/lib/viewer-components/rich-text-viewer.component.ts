import { Component, Input } from '@angular/core';
import { ReadTextValueAsXml } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-rich-text-viewer',
  template: `
    <div
      data-cy="rich-text-switch"
      class="rich-text-viewer"
      [innerHTML]="value.strval || '' | footnoteParser: index | internalLinkReplacer | addTargetBlank"
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
            font-size: small;
            cursor: pointer;
          }
        }
      }
    `,
  ],
})
export class RichTextViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsXml;
  @Input({ required: true }) index!: number;
}
