import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Editor from 'ckeditor5-custom-build';
import { ckEditor } from './ck-editor';

@Component({
  selector: 'app-ck-editor',
  template: ` <ckeditor [formControl]="control" [config]="editorConfig" [editor]="editor" />
    <mat-error *ngIf="control.touched && control.errors as errors">{{ errors | humanReadableError }}</mat-error>`,
})
export class CkEditorComponent {
  @Input({ required: true }) control!: FormControl<string>;

  readonly editorConfig = ckEditor.config;
  readonly editor = Editor;
}
