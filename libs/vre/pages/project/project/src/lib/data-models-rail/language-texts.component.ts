import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';
import { DESCRIPTION_LANGUAGES, TextKind } from './description-editor.component';
import { HighlightPipe } from './highlight.pipe';

const orderOf = (language: string) => {
  const index = DESCRIPTION_LANGUAGES.indexOf(language);
  return index < 0 ? DESCRIPTION_LANGUAGES.length : index;
};

/**
 * The texts a cell shows, in the order the app lists languages: every one, or with "All languages" off only the one
 * the app shows (`shown`, in the interface language when it has it), else the first.
 */
export function shownTexts(texts: readonly LanguageText[], shown: string, allLanguages: boolean): LanguageText[] {
  const sorted = [...texts].sort((a, b) => orderOf(a.language) - orderOf(b.language));
  if (allLanguages) return sorted;
  const one = sorted.find(text => text.value === shown) ?? sorted[0];
  return one ? [one] : [];
}

/** The languages to offer adding: every missing one, or with "All languages" off the interface one, if none. */
export function missingLanguages(
  texts: readonly LanguageText[],
  allLanguages: boolean,
  interfaceLanguage: string
): string[] {
  if (!allLanguages) {
    if (texts.length) return [];
    return [DESCRIPTION_LANGUAGES.includes(interfaceLanguage) ? interfaceLanguage : DESCRIPTION_LANGUAGES[0]];
  }
  return DESCRIPTION_LANGUAGES.filter(language => !texts.some(text => text.language === language));
}

/** A language to edit, and the line to open its editor under. */
export interface LanguageTextEdit {
  language: string;
  origin: HTMLElement;
}

/**
 * A name or description in a table cell, in each of its languages: one line per language with "All languages" on,
 * else the one the app shows. To an editor, a pencil on a hovered line and "+ DE" for a missing language ask to edit it.
 */
@Component({
  selector: 'app-language-texts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighlightPipe, MatIcon, MatIconButton, TranslatePipe],
  host: { '[class.expanded]': 'expanded()', '[class.is-label]': "kind() === 'label'" },
  template: `
    @let t = 'pages.dataModels2.descriptionEditor';
    @for (text of lines(); track text.language) {
      <span
        #line
        class="lang-line"
        [class.single]="!allLanguages()"
        [class.active]="text.language === activeLanguage()">
        @if (allLanguages()) {
          <span class="lang">{{ text.language }}</span>
        }
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
      <span #gaps class="lang-missing" [class.single]="!allLanguages()">
        @for (language of missing(); track language) {
          <button
            type="button"
            class="lang-add"
            [attr.data-cy]="cyPrefix() + '-add-' + kind()"
            [class.active]="language === activeLanguage()"
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

      // One line per language; a pencil shows on hover to edit that language.
      .lang-line {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) 24px;
        align-items: center;
        gap: 4px;
        margin: 0 -4px;
        padding: 0 0 0 4px;
        border-radius: 4px;

        &.single {
          grid-template-columns: minmax(0, 1fr) 24px;
        }

        // Only the pencil shows on hover: the text itself opens nothing.
        &:hover,
        &:focus-within,
        &.active {
          .lang-edit {
            opacity: 1;
          }
        }

        &.active {
          background: rgba(0, 0, 0, 0.05);
          box-shadow: inset 0 0 0 1px $primary;
        }
      }

      // A name hugs its text, so the pencil sits right after it.
      :host(.is-label) {
        .lang-line {
          grid-template-columns: 22px minmax(0, max-content) 24px;

          &.single {
            grid-template-columns: minmax(0, max-content) 24px;
          }
        }

        .lang-text {
          font-weight: 500;
        }

        .lang-missing {
          padding-top: 0;
        }
      }

      .lang {
        font-size: 10.5px;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
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

      // The languages without a text, to add one.
      .lang-missing {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 2px 0 0 22px;

        &.single {
          padding-left: 0;
        }
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
        &:focus-visible,
        &.active {
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
        background: #fde68a;
        color: inherit;
      }
    `,
  ],
})
export class LanguageTextsComponent {
  private readonly _translate = inject(TranslateService);

  /** The text in each language it has. */
  readonly texts = input.required<LanguageText[]>();
  /** The text the app shows, in the interface language when it has it; shown alone with "All languages" off. */
  readonly shown = input('');
  readonly kind = input.required<TextKind>();
  readonly allLanguages = input(false);
  /** Whether the viewer may edit the text, which shows the pencils and the missing languages. */
  readonly canEdit = input(false);
  /** The language being edited, its line outlined. */
  readonly activeLanguage = input<string | null>(null);
  /** Whose text it is, for the buttons' names. */
  readonly owner = input('');
  /** Long texts wrap instead of being cut. */
  readonly expanded = input(false);
  readonly cyPrefix = input('data-model');
  /** What a search or filter looks for, marked where the text has it. */
  readonly highlight = input<readonly string[]>([]);

  readonly edit = output<LanguageTextEdit>();

  readonly lines = computed(() => shownTexts(this.texts(), this.shown(), this.allLanguages()));
  readonly missing = computed(() =>
    missingLanguages(this.texts(), this.allLanguages(), this._translate.currentLang ?? '')
  );
}
