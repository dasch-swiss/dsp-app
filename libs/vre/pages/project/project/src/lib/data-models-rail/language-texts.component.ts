import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';
import { HighlightPipe } from './highlight.pipe';
import { DESCRIPTION_LANGUAGES, TextKind } from './text-kind';

const orderOf = (language: string) => {
  const index = DESCRIPTION_LANGUAGES.indexOf(language);
  return index < 0 ? DESCRIPTION_LANGUAGES.length : index;
};

/**
 * The text a cell shows: the one the app shows (`shown`, in the interface language when it has it), else the first in
 * the order the app lists languages.
 */
export function shownTexts(texts: readonly LanguageText[], shown: string): LanguageText[] {
  const sorted = [...texts].sort((a, b) => orderOf(a.language) - orderOf(b.language));
  const one = sorted.find(text => text.value === shown) ?? sorted[0];
  return one ? [one] : [];
}

/** The language to offer adding, when there is no text at all: the interface language, else the first. */
export function missingLanguages(texts: readonly LanguageText[], interfaceLanguage: string): string[] {
  if (texts.length) return [];
  return [DESCRIPTION_LANGUAGES.includes(interfaceLanguage) ? interfaceLanguage : DESCRIPTION_LANGUAGES[0]];
}

/** A language to edit, and the line to open its editor under. */
export interface LanguageTextEdit {
  language: string;
  origin: HTMLElement;
}

/**
 * A name or description in a table cell, as the app shows it. To an editor, a pencil on the hovered line and "+ DE"
 * for a missing text ask to edit it.
 */
@Component({
  selector: 'app-language-texts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighlightPipe, MatIcon, MatIconButton, TranslatePipe],
  host: { '[class.expanded]': 'expanded()', '[class.is-label]': "kind() === 'label'" },
  template: `
    @let t = 'pages.dataModels2.descriptionEditor';
    @for (text of lines(); track text.language) {
      <span #line class="lang-line">
        <span class="lang-text" [title]="expanded() ? '' : text.value">
          @for (part of text.value | highlight: highlight(); track $index) {
            @if (part.match) {
              <mark>{{ part.text }}</mark>
            } @else {
              <span>{{ part.text }}</span>
            }
          }
        </span>
        @if (canEdit()) {
          <button
            mat-icon-button
            type="button"
            class="lang-edit"
            [attr.data-cy]="cyPrefix() + '-edit-' + kind()"
            [attr.aria-label]="
              t + (kind() === 'label' ? '.editLabel' : '.edit') | translate: { language: text.language, class: owner() }
            "
            (click)="$event.stopPropagation(); edit.emit({ language: text.language, origin: line })">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </span>
    } @empty {
      @if (shown()) {
        <!-- A text without a language: shown as it is. -->
        <span class="lang-text" [title]="expanded() ? '' : shown()">
          @for (part of shown() | highlight: highlight(); track $index) {
            @if (part.match) {
              <mark>{{ part.text }}</mark>
            } @else {
              <span>{{ part.text }}</span>
            }
          }
        </span>
      } @else if (!canEdit()) {
        <span class="none">—</span>
      }
    }
    @if (canEdit() && missing().length) {
      <span #gaps class="lang-missing">
        @for (language of missing(); track language) {
          <button
            type="button"
            class="lang-add"
            [attr.data-cy]="cyPrefix() + '-add-' + kind()"
            [attr.aria-label]="
              t + (kind() === 'label' ? '.addLabel' : '.add') | translate: { language, class: owner() }
            "
            (click)="$event.stopPropagation(); edit.emit({ language, origin: gaps })">
            + {{ language }}
          </button>
        }
      </span>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      // The text; a pencil shows on hover to edit it.
      .lang-line {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 24px;
        align-items: center;
        gap: 4px;
        margin: 0 -4px;
        padding: 0 0 0 4px;
        border-radius: 4px;

        // Only the pencil shows on hover: the text itself opens nothing.
        &:hover,
        &:focus-within {
          .lang-edit {
            opacity: 1;
          }
        }
      }

      // A name hugs its text, so the pencil sits right after it.
      :host(.is-label) {
        .lang-line {
          grid-template-columns: minmax(0, max-content) 24px;
        }

        .lang-text {
          font-weight: 500;
        }

        .lang-missing {
          padding-top: 0;
        }
      }

      .lang-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host(.expanded) {
        .lang-text {
          white-space: normal;
        }

        .lang-line {
          align-items: start;
        }
      }

      .lang-edit.mat-mdc-icon-button {
        --mat-icon-button-state-layer-size: 24px;
        width: 24px;
        height: 24px;
        padding: 0;
        opacity: 0;
        color: $primary;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }

        @media (hover: none) {
          opacity: 0.6;
        }
      }

      // The language to add a text in, when there is none.
      .lang-missing {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding-top: 2px;
      }

      .lang-add {
        border: 1px dashed $cool_gray_300;
        border-radius: 10px;
        background: none;
        padding: 0 7px;
        font: inherit;
        font-size: 10.5px;
        line-height: 16px;
        text-transform: uppercase;
        color: $cool_gray_500;
        cursor: pointer;

        &:hover,
        &:focus-visible {
          border-color: $primary;
          color: $primary;
        }
      }

      .none {
        color: $cool_gray_400;
      }

      // What a filter or search matches.
      mark {
        border-radius: 2px;
        background: $yellow_200;
        color: inherit;
      }
    `,
  ],
})
export class LanguageTextsComponent {
  private readonly _translate = inject(TranslateService);

  /** The text in each language it has. */
  readonly texts = input.required<LanguageText[]>();
  /** The text the app shows, in the interface language when it has it. */
  readonly shown = input('');
  readonly kind = input.required<TextKind>();
  /** Whether the viewer may edit the text, which shows the pencils and the missing languages. */
  readonly canEdit = input(false);
  /** Whose text it is, for the buttons' names. */
  readonly owner = input('');
  /** Long texts wrap instead of being cut. */
  readonly expanded = input(false);
  readonly cyPrefix = input('data-model');
  /** What a search or filter looks for, marked where the text has it. */
  readonly highlight = input<readonly string[]>([]);

  readonly edit = output<LanguageTextEdit>();

  readonly lines = computed(() => shownTexts(this.texts(), this.shown()));
  readonly missing = computed(() => missingLanguages(this.texts(), this._translate.currentLang ?? ''));
}
