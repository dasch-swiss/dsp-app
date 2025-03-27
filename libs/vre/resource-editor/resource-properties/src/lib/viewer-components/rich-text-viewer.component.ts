import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FootnoteService } from '../footnote.service';

@Component({
  selector: 'app-rich-text-viewer',
  template: ` <div
      data-cy="rich-text-switch"
      class="rich-text-viewer"
      [innerHTML]="control.value | footnoteParser | internalLinkReplacer | addTargetBlank"
      appFootnote></div>
    <app-footnotes *ngIf="footnoteService.footnotes.length > 0" />`,
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
export class RichTextViewerComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<string | null>;

  constructor(public footnoteService: FootnoteService) {}

  ngOnInit() {
    this.control.valueChanges.subscribe(() => {
      this.footnoteService.reset();
    });
  }
}
