import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ValidatorFn } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AvailableLanguage, AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { MultiLanguageFormArray, MultiLanguageFormControl } from './multi-language-form-array.type';
import { MULTI_LANGUAGE_MODE, MultiLanguageMode } from './multi-language-mode';

/**
 * A multilingual text under its heading, in one of two modes, as `MULTI_LANGUAGE_MODE` says unless `mode` is set: one
 * language at a time, under a row of language tabs that mark the languages with a text, or every language in its own
 * field. It edits the same form array as `app-multi-language-input` and `app-multi-language-textarea`: typing in a
 * language adds its text, emptying it removes it.
 */
@Component({
  selector: 'app-multi-language-fields',
  host: { '(click)': 'focusField($event)' },
  imports: [
    CdkTextareaAutosize,
    HumanReadableErrorPipe,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    NgTemplateOutlet,
    TranslatePipe,
  ],
  template: `
    <div class="heading">
      {{ label }}
      @if (isRequired) {
        <span aria-hidden="true">*</span>
      }
    </div>
    @if (shownMode() === 'one') {
      <div class="tabs" role="tablist" [attr.aria-label]="label">
        @for (language of languages; track language.language) {
          @let filled = hasText(language.language);
          <button
            type="button"
            role="tab"
            class="tab"
            [class.filled]="filled"
            [attr.aria-selected]="language.language === current()"
            [attr.data-cy]="'multi-language-tab-' + language.language"
            [title]="language.value"
            (click)="current.set(language.language)">
            <span class="dot" [class.on]="filled" aria-hidden="true"></span>
            {{ language.language }}
          </button>
        }
        <span class="count" data-cy="multi-language-count">{{
          'ui.multiLanguage.filled' | translate: { count: filledCount(), total: languages.length }
        }}</span>
      </div>
      <!-- One field, made again for each language picked. -->
      @for (language of [current()]; track language) {
        <ng-container *ngTemplateOutlet="field; context: { $implicit: languageOf(language) }" />
      }
    } @else {
      @for (language of languages; track language.language) {
        <ng-container *ngTemplateOutlet="field; context: { $implicit: language }" />
      }
    }
    @if (formArray.errors && formArray.touched) {
      <mat-error class="array-error">{{ formArray.errors | humanReadableError }}</mat-error>
    }

    <ng-template #field let-language>
      @let control = controlOf(language.language);
      <mat-form-field class="field" subscriptSizing="dynamic">
        <mat-label>{{ language.value }}</mat-label>
        @if (multiline) {
          <textarea
            matInput
            cdkTextareaAutosize
            [cdkAutosizeMinRows]="shownMode() === 'one' ? 3 : 2"
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
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }

      // The field's name, as a form label: written as is, so it reads as a field and not as a section.
      .heading {
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
        margin: 4px 0 2px;
      }

      .tabs {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 2px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        margin-bottom: 4px;
      }

      .tab {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 0;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        padding: 4px 10px 6px;
        background: none;
        font:
          13px 'Roboto Mono',
          monospace;
        color: rgba(0, 0, 0, 0.54);
        cursor: pointer;

        &.filled {
          color: rgba(0, 0, 0, 0.87);
          font-weight: 500;
        }

        &[aria-selected='true'] {
          color: var(--mat-sys-primary, #336790);
          border-bottom-color: var(--mat-sys-primary, #336790);
        }

        &:focus-visible {
          outline: 2px solid var(--mat-sys-primary, #336790);
          outline-offset: -2px;
        }
      }

      // A green dot for a language with a text, an empty ring for one without.
      .dot {
        width: 7px;
        height: 7px;
        box-sizing: border-box;
        border-radius: 50%;
        border: 1.5px solid rgba(0, 0, 0, 0.38);

        &.on {
          background: #2e7d4f;
          border-color: #2e7d4f;
        }
      }

      .count {
        margin-left: auto;
        padding-bottom: 6px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
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
export class MultiLanguageFieldsComponent implements OnInit {
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
  /** One language at a time or all at once; unless set, as `MULTI_LANGUAGE_MODE` says. */
  @Input() mode?: MultiLanguageMode;

  readonly languages = AvailableLanguages;
  /** The language shown in "one at a time": the interface language if it has a text, else the first with one. */
  readonly current = signal<AvailableLanguage>(AvailableLanguages[0].language);

  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * A click anywhere in it, a language tab included, ends in the text field shown, ready to type in; in "all languages",
   * in the field clicked, as usual.
   */
  focusField(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea')) return;
    if (this.shownMode() === 'all' && !target.closest('.tab')) return;
    // After the field of the language picked is drawn.
    setTimeout(() => this._host.nativeElement.querySelector<HTMLElement>('input, textarea')?.focus());
  }

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _localization: LocalizationService
  ) {}

  ngOnInit(): void {
    const ui = this._localization.currentLanguage as AvailableLanguage;
    const known = this.languages.some(language => language.language === ui);
    const first = this.languages.find(language => this.hasText(language.language))?.language;
    this.current.set(known && this.hasText(ui) ? ui : (first ?? (known ? ui : this.languages[0].language)));
  }

  shownMode(): MultiLanguageMode {
    return this.mode ?? MULTI_LANGUAGE_MODE();
  }

  languageOf(language: AvailableLanguage) {
    return this.languages.find(item => item.language === language)!;
  }

  controlOf(language: AvailableLanguage): MultiLanguageFormControl | undefined {
    return this.formArray.controls.find(control => control.getRawValue().language === language);
  }

  hasText(language: AvailableLanguage): boolean {
    return (this.controlOf(language)?.getRawValue().value ?? '').trim() !== '';
  }

  filledCount(): number {
    return this.languages.filter(language => this.hasText(language.language)).length;
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
