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
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { AvailableLanguageKeys, AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';

/** The languages a description can have, in the order the app lists them. */
export const DESCRIPTION_LANGUAGES: readonly string[] = AvailableLanguageKeys;

const NAMES = new Map<string, string>(AvailableLanguages.map(({ language, value }) => [language, value]));

/**
 * Edits a class's description in one language, with tabs to the others and a switch to show them all stacked.
 * Saves every language at once, as dsp-api takes a description.
 */
@Component({
  selector: 'app-description-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkTextareaAutosize,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    MatSlideToggle,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataModels2.descriptionEditor';
    <div
      class="editor"
      role="dialog"
      data-cy="description-editor"
      [attr.aria-label]="t + '.title' | translate: { class: classLabel() }"
      (keydown.escape)="cancelled.emit()"
      (keydown.control.enter)="submit()"
      (keydown.meta.enter)="submit()">
      <div class="head">
        <mat-button-toggle-group
          hideSingleSelectionIndicator
          class="languages"
          [attr.aria-label]="t + '.language' | translate"
          [value]="all() ? null : current()"
          (change)="choose($event.value)">
          @for (language of languages; track language) {
            <mat-button-toggle [value]="language" [title]="nameOf(language)">
              <span class="dot" [class.empty]="!draft()[language]?.trim()"></span>{{ language }}
            </mat-button-toggle>
          }
        </mat-button-toggle-group>
        <mat-slide-toggle [checked]="all()" (change)="all.set($event.checked)">
          {{ t + '.allLanguages' | translate }}
        </mat-slide-toggle>
      </div>

      @if (all()) {
        @for (language of languages; track language) {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>{{ nameOf(language) }}</mat-label>
            <textarea
              matInput
              cdkTextareaAutosize
              cdkAutosizeMinRows="1"
              cdkAutosizeMaxRows="6"
              [attr.data-language]="language"
              [value]="draft()[language] ?? ''"
              (input)="write(language, $any($event.target).value)"></textarea>
          </mat-form-field>
        }
      } @else {
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ t + '.descriptionIn' | translate: { language: nameOf(current()) } }}</mat-label>
          <textarea
            matInput
            cdkTextareaAutosize
            cdkAutosizeMinRows="3"
            cdkAutosizeMaxRows="10"
            [attr.data-language]="current()"
            [value]="draft()[current()] ?? ''"
            (input)="write(current(), $any($event.target).value)"></textarea>
        </mat-form-field>
      }

      <div class="actions">
        @if (empty()) {
          <span class="hint">{{ t + '.needsOne' | translate }}</span>
        }
        <button mat-button type="button" (click)="cancelled.emit()">
          {{ 'ui.common.actions.cancel' | translate }}
        </button>
        <button
          mat-flat-button
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

      .editor {
        width: 400px;
        max-width: calc(100vw - 32px);
        box-sizing: border-box;
        padding: 12px;
        display: grid;
        gap: 10px;
        background: #fff;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .languages {
        --mat-button-toggle-height: 30px;
        --mat-button-toggle-label-text-line-height: 28px;
        font-size: 12px;
        text-transform: uppercase;
      }

      .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        margin-right: 5px;
        border-radius: 50%;
        background: #2e7d4f;
        vertical-align: 1px;

        &.empty {
          width: 4px;
          height: 4px;
          background: transparent;
          border: 1.5px solid $cool_gray_400;
        }
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

  /** The description, in each language it has. */
  readonly descriptions = input.required<LanguageText[]>();
  /** The language to edit first. */
  readonly language = input.required<string>();
  readonly classLabel = input('');
  readonly saving = input(false);

  /** The description in every language that has text, once Save is clicked. */
  readonly saved = output<LanguageText[]>();
  readonly cancelled = output<void>();

  readonly languages = DESCRIPTION_LANGUAGES;
  readonly current = linkedSignal(() => this.language());
  readonly all = signal(false);

  private readonly _original = computed(() =>
    Object.fromEntries(this.descriptions().map(({ language, value }) => [language, value]))
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

  choose(language: string): void {
    this.current.set(language);
    this.all.set(false);
    setTimeout(() => this._focus());
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

  private _focus(): void {
    (this._host.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('textarea')?.focus();
  }
}
