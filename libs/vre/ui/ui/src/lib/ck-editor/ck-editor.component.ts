import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Editor from 'ckeditor5-custom-build';
import { startWith } from 'rxjs/operators';
import { ckEditor } from './ck-editor';
import { unescapeHtml } from './unescape-html';

@Component({
  selector: 'app-ck-editor',
  styleUrl: './ck-editor.component.scss',
  template: ` <ckeditor
      [formControl]="footnoteControl"
      [config]="ckEditor.config"
      [editor]="editor"
      style="margin-bottom: 22px; display: block;" />
    @if (control.touched && control.errors; as errors) {
      <mat-error>{{ errors | humanReadableError }}</mat-error>
    }`,
})
export class CkEditorComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<string | null>;
  footnoteControl = new FormControl('');

  readonly editor = Editor;
  protected readonly ckEditor = ckEditor;

  ngOnInit() {
    let updating = false;

    this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(change => {
      if (updating) {
        return;
      }
      updating = true;
      this.footnoteControl.patchValue(change === null ? null : this._parseToFootnote(change));
      updating = false;
    });

    this.footnoteControl.valueChanges.subscribe(value => {
      if (updating) {
        return;
      }
      updating = true;
      this.control.patchValue(value ? this._parseFromFootnote(value) : '');
      updating = false;
    });
  }

  private _parseToFootnote(rawHtml: string) {
    const _footnoteRegExp2 = /<footnote content="([^>]+)"\/>/g;
    return rawHtml.replace(_footnoteRegExp2, (match, content) => {
      return `<footnote content="${content}">[Footnote]</footnote>`;
    });
  }

  private _parseFromFootnote(rawHtml: string) {
    const _footnoteRegExp = /<footnote content="([^>]+)">((?:(?!<\/footnote>).)*)<\/footnote>/g;
    return rawHtml.replace(_footnoteRegExp, (match, content) => {
      const escapedContent = unescapeHtml(content);
      return `<footnote content="${escapedContent}"></footnote>`;
    });
  }
}
