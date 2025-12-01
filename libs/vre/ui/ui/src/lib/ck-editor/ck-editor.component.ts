import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { TranslateModule } from '@ngx-translate/core';
import * as Editor from 'ckeditor5-custom-build';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { HumanReadableErrorPipe } from '../human-readable-error.pipe';
import { ckEditor } from './ck-editor';
import { crossProjectLinkValidator } from './cross-project-link.validator';
import { unescapeHtml } from './unescape-html';

@Component({
  selector: 'app-ck-editor',
  styleUrl: './ck-editor.component.scss',
  template: `
    <ckeditor
      [formControl]="footnoteControl"
      [config]="ckEditor.config"
      [editor]="editor"
      style="margin-bottom: 22px; display: block;" />
    @if (control.touched && control.errors?.['crossProjectLink']; as error) {
      <mat-error>
        <div>{{ crossProjectLinkError.message | translate }}</div>
        @if (error.invalidLinks && error.invalidLinks.length > 0) {
          <div style="margin-top: 8px;">
            <strong>{{ badLinksError.message | translate }}</strong>
            <ul style="margin: 4px 0; padding-left: 20px;">
              @for (link of error.invalidLinks; track link.url) {
                <li>{{ link.url }}</li>
              }
            </ul>
          </div>
        }
      </mat-error>
    } @else if (control.touched && control.errors; as errors) {
      <mat-error>{{ errors | humanReadableError | translate }}</mat-error>
    }
  `,
  imports: [CKEditorModule, MatFormFieldModule, ReactiveFormsModule, TranslateModule, HumanReadableErrorPipe],
  standalone: true,
})
export class CkEditorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() projectShortcode?: string;
  footnoteControl = new FormControl('');

  readonly editor = Editor;
  readonly crossProjectLinkError = {
    errorKey: 'crossProjectLink',
    message: 'ui.common.errors.crossProjectLink',
  };
  readonly badLinksError = {
    errorKey: 'badLinks',
    message: 'ui.common.errors.badLinks',
  };

  protected readonly ckEditor = ckEditor;

  private readonly _destroy$ = new Subject<void>();
  private _crossProjectValidator?: ValidatorFn;

  ngOnInit() {
    if (this.projectShortcode) {
      this._crossProjectValidator = crossProjectLinkValidator(this.projectShortcode);
      this.control.addValidators(this._crossProjectValidator);
      this.control.updateValueAndValidity();
    }
    let updating = false;

    this.control.valueChanges.pipe(startWith(this.control.value), takeUntil(this._destroy$)).subscribe(change => {
      if (change === '') {
        this.control.patchValue(null);
        return;
      }

      if (updating) {
        return;
      }
      updating = true;
      this.footnoteControl.patchValue(change === null ? null : this._parseToFootnote(change));
      updating = false;
    });

    this.footnoteControl.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(value => {
      if (updating) {
        return;
      }
      updating = true;
      this.control.patchValue(value ? this._parseFromFootnote(value) : '');
      updating = false;
    });

    if (!this.control.touched) {
      this.control.markAsTouched();
    }
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();

    // Remove the validator that was added in ngOnInit
    if (this._crossProjectValidator) {
      this.control.removeValidators(this._crossProjectValidator);
      this.control.updateValueAndValidity();
    }
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
