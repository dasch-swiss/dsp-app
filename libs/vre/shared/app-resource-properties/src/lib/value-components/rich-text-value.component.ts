import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Editor from 'ckeditor5-custom-build';
import { ckEditor } from '../ck-editor';

@Component({
  selector: 'app-rich-text-value',
  template: `
    <ckeditor [formControl]="control" [config]="editorConfig" [editor]="editor" (change)="onChange()"></ckeditor>
    <mat-error *ngIf="control.touched && control.errors as errors">{{ errors | humanReadableError }}</mat-error>
  `,
})
export class RichTextValueComponent {
  @Input() control!: FormControl<string>;

  readonly editorConfig = ckEditor.config;
  readonly editor = Editor;
  onChange = () => {};
}
