import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, Input } from '@angular/core';
import { FormBuilder, ValidatorFn } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AvailableLanguage, AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { MultiLanguageFormArray, MultiLanguageFormControl } from './multi-language-form-array.type';

/** How a form shows a multilingual text: one field with a language switcher, or every language in its own field. */
export type MultiLanguageLayout = 'switcher' | 'stacked';

/**
 * Every language of a multilingual text at once, each in its own field under one heading, rather than one field with a
 * language switcher as `app-multi-language-input` and `app-multi-language-textarea` show it. It edits the same form
 * array: typing in a language's field adds its text, emptying the field removes it.
 */
@Component({
  selector: 'app-multi-language-fields',
  imports: [CdkTextareaAutosize, HumanReadableErrorPipe, MatError, MatFormField, MatInput, MatLabel],
  template: `
    <div class="heading">
      {{ label }}
      @if (isRequired) {
        <span aria-hidden="true">*</span>
      }
    </div>
    @for (language of languages; track language.language) {
      @let control = controlOf(language.language);
      <mat-form-field class="field" subscriptSizing="dynamic">
        <mat-label>{{ language.value }}</mat-label>
        @if (multiline) {
          <textarea
            matInput
            cdkTextareaAutosize
            rows="2"
            [attr.data-cy]="'multi-language-' + language.language"
            [value]="control?.controls?.value?.value ?? ''"
            [disabled]="!editable || !!control?.disabled"
            (input)="change(language.language, $any($event.target).value)"
            (blur)="formArray.markAsTouched()"></textarea>
        } @else {
          <input
            matInput
            [attr.data-cy]="'multi-language-' + language.language"
            [value]="control?.controls?.value?.value ?? ''"
            [disabled]="!editable || !!control?.disabled"
            (input)="change(language.language, $any($event.target).value)"
            (blur)="formArray.markAsTouched()" />
        }
        @if (control?.controls?.value?.errors; as errors) {
          <mat-error>{{ errors | humanReadableError }}</mat-error>
        }
      </mat-form-field>
    }
    @if (formArray.errors && formArray.touched) {
      <mat-error class="array-error">{{ formArray.errors | humanReadableError }}</mat-error>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }

      .heading {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.6);
        margin: 4px 0 2px;
      }

      .field {
        width: 100%;
      }

      .array-error {
        font-size: 12px;
      }
    `,
  ],
})
export class MultiLanguageFieldsComponent {
  @Input({ required: true }) formArray!: MultiLanguageFormArray;
  /** The heading over the fields, such as "Label". */
  @Input({ required: true }) label!: string;
  /** Whether each language gets a text area rather than a one-line field. */
  @Input() multiline = false;
  @Input() editable = true;
  /** The validators a language's text gets when it is added. */
  @Input() validators: ValidatorFn[] = [];
  /** Whether the heading shows the required mark; the form array's own validators decide what is required. */
  @Input() isRequired = false;

  readonly languages = AvailableLanguages;

  constructor(private readonly _fb: FormBuilder) {}

  controlOf(language: AvailableLanguage): MultiLanguageFormControl | undefined {
    return this.formArray.controls.find(control => control.getRawValue().language === language);
  }

  /** A language's text typed: added when new, changed, or removed once emptied. */
  change(language: AvailableLanguage, text: string): void {
    const control = this.controlOf(language);
    if (!control) {
      if (text === '') return;
      this.formArray.push(this._fb.nonNullable.group({ language, value: [text, this.validators] }));
    } else if (text === '') {
      this.formArray.removeAt(this.formArray.controls.indexOf(control));
    } else {
      control.controls.value.setValue(text);
    }
    // Touched as well, as some dialogs save only what was touched.
    this.formArray.markAsDirty();
    this.formArray.markAsTouched();
  }
}
