import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-rich-text-viewer',
  template: `
    <div
      data-cy="rich-text-switch"
      class="rich-text-viewer"
      [innerHTML]="control.value | footnoteParser | internalLinkReplacer | addTargetBlank"
      appFootnote></div>
  `,
  styles: [
    `
      .rich-text-viewer ::ng-deep * {
        &:first-child {
          margin-top: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    `,
  ],
})
export class RichTextViewerComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
