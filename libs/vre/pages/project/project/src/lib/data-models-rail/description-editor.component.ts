import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AvailableLanguageKeys, AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';

/** The texts of a class edited in several languages. */
export type TextKind = 'label' | 'description';

/** The languages a description can have, in the order the app lists them. */
export const DESCRIPTION_LANGUAGES: readonly string[] = AvailableLanguageKeys;

const NAMES = new Map<string, string>(AvailableLanguages.map(({ language, value }) => [language, value]));

/**
 * Edits a class's or property's label or description in every language at once, as a side panel: one field per
 * language, the one it opened on focused. Saves every language at once, as dsp-api takes a description.
 */
@Component({
  selector: 'app-description-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkTextareaAutosize,
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataModels2.descriptionEditor';
    <div
      class="editor"
      role="dialog"
      data-cy="description-editor"
      [attr.aria-label]="t + (kind() === 'label' ? '.labelTitle' : '.title') | translate: { class: classLabel() }"
      (keydown.escape)="cancelled.emit()"
      (keydown.control.enter)="submit()"
      (keydown.meta.enter)="submit()">
      <header class="head">
        <h2>{{ t + (kind() === 'label' ? '.labelTitle' : '.title') | translate: { class: classLabel() } }}</h2>
        <button
          mat-icon-button
          type="button"
          data-cy="description-editor-close"
          [attr.aria-label]="'ui.common.actions.cancel' | translate"
          (click)="cancelled.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div class="fields">
        @for (language of languages; track language) {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>{{ nameOf(language) }}</mat-label>
            <textarea
              matInput
              cdkTextareaAutosize
              cdkAutosizeMinRows="1"
              [cdkAutosizeMaxRows]="kind() === 'label' ? 3 : 10"
              [attr.data-language]="language"
              [value]="draft()[language] ?? ''"
              (input)="write(language, $any($event.target).value)"></textarea>
          </mat-form-field>
        }
      </div>

      <div class="actions">
        @if (empty()) {
          <span class="hint">{{ t + '.needsOne' | translate }}</span>
        }
        <button mat-button type="button" (click)="cancelled.emit()">
          {{ 'ui.common.actions.cancel' | translate }}
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          data-cy="description-editor-save"
          [disabled]="saving() || !changed() || empty()"
          (click)="submit()">
          @if (saving()) {
            <mat-spinner diameter="16" />
          } @else {
            {{ t + '.save' | translate }}
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      // As the class and property panels, in their place.
      .editor {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px 24px 16px;
        background: #fff;
        border-left: 1px solid #ebebeb;
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08);
      }

      .head {
        display: flex;
        align-items: center;
        gap: 12px;

        h2 {
          flex: 1;
          min-width: 0;
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          line-height: 28px;
        }
      }

      .fields {
        flex: 1;
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 4px;
      }

      .actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .hint {
        margin-right: auto;
        font-size: 12px;
        color: $cool_gray_600;
      }
    `,
  ],
})
export class DescriptionEditorComponent {
  private readonly _host = inject(ElementRef<HTMLElement>);

  /** The text, in each language it has. */
  readonly texts = input.required<LanguageText[]>();
  /** Whether the text is the class's label or its description. */
  readonly kind = input<TextKind>('description');
  /** The language to edit first. */
  readonly language = input.required<string>();
  readonly classLabel = input('');
  readonly saving = input(false);

  /** The description in every language that has text, once Save is clicked. */
  readonly saved = output<LanguageText[]>();
  readonly cancelled = output<void>();

  readonly languages = DESCRIPTION_LANGUAGES;

  private readonly _original = computed(() =>
    Object.fromEntries(this.texts().map(({ language, value }) => [language, value]))
  );
  readonly draft = linkedSignal<Record<string, string>>(() => ({ ...this._original() }));

  readonly changed = computed(() =>
    this.languages.some(language => (this.draft()[language] ?? '').trim() !== (this._original()[language] ?? '').trim())
  );
  /** dsp-api keeps at least one language; removing the last one is for the data model editor. */
  readonly empty = computed(() => this.languages.every(language => !(this.draft()[language] ?? '').trim()));

  constructor() {
    afterNextRender(() => this._focus());
  }

  nameOf(language: string): string {
    return NAMES.get(language) ?? language;
  }

  write(language: string, value: string): void {
    this.draft.update(draft => ({ ...draft, [language]: value }));
  }

  submit(): void {
    if (this.saving() || !this.changed() || this.empty()) return;
    this.saved.emit(
      this.languages
        .map(language => ({ language, value: (this.draft()[language] ?? '').trim() }))
        .filter(text => !!text.value)
    );
  }

  /** Focuses the field of the language opened on, the caret at the end of its text. */
  private _focus(): void {
    const host = this._host.nativeElement as HTMLElement;
    const field =
      host.querySelector<HTMLTextAreaElement>(`textarea[data-language="${this.language()}"]`) ??
      host.querySelector<HTMLTextAreaElement>('textarea');
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }
}
