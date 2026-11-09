import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { DESCRIPTION_LANGUAGES } from './description-editor.component';

const NAMES = new Map<string, string>(AvailableLanguages.map(({ language, value }) => [language, value]));

/** The languages a table shows, stored as chosen; none chosen (`null`) follows the app language. */
export function parseLanguages(stored: string): string[] | null {
  try {
    const languages = JSON.parse(stored);
    if (!Array.isArray(languages)) return null;
    const known = DESCRIPTION_LANGUAGES.filter(language => languages.includes(language));
    return known.length ? known : null;
  } catch {
    return null;
  }
}

/**
 * The languages the names and descriptions of a table show in: one checkbox per language. By default only the app
 * language is ticked, and follows it; ticking or unticking one keeps the choice. At least one stays ticked. "Show all"
 * ticks them all; "Hide all" goes back to the app language alone.
 */
@Component({
  selector: 'app-languages-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatCheckbox, MatIcon, MatMenu, MatMenuTrigger, TranslatePipe],
  template: `
    @let r = 'pages.dataModels2';
    @let v = 'pages.dataBrowser.viewOptions';
    <button
      mat-stroked-button
      type="button"
      class="languages"
      [attr.data-cy]="cyPrefix() + '-languages'"
      [attr.aria-label]="(r + '.languages' | translate) + ': ' + label()"
      [matMenuTriggerFor]="menu">
      <mat-icon>translate</mat-icon>
      <b [class.codes]="!allTicked()">{{ label() }}</b>
      <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <!-- The menu stays open while languages are ticked, and only Escape closes it from the keyboard. -->
      <div
        class="menu"
        role="group"
        [attr.aria-label]="r + '.languages' | translate"
        (click)="$event.stopPropagation()"
        (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
        <!-- As View options' columns: a heading, and a button to show them all or go back to one. -->
        <span class="head">
          <span class="heading">{{ r + '.languages' | translate }}</span>
          <button
            mat-button
            type="button"
            class="all"
            [attr.data-cy]="cyPrefix() + '-language-all'"
            (click)="toggleAll()">
            {{ (allTicked() ? v + '.hideAllShort' : v + '.showAllShort') | translate }}
          </button>
        </span>
        @for (language of languages; track language) {
          <mat-checkbox
            [attr.data-cy]="cyPrefix() + '-language-' + language"
            [checked]="ticked().includes(language)"
            [disabled]="ticked().length === 1 && ticked().includes(language)"
            (change)="toggle(language)">
            {{ nameOf(language) }}
          </mat-checkbox>
        }
      </div>
    </mat-menu>
  `,
  styles: [
    `
      .languages {
        --mat-button-outlined-container-height: 36px;
        background: white;
        font-size: 13px;

        b {
          font-weight: 500;
          &.codes {
            text-transform: uppercase;
          }
        }
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .heading {
        padding: 4px 0;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7280;
      }

      .all {
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
      }

      .menu {
        display: flex;
        flex-direction: column;
        min-width: 180px;
        padding: 4px 12px;
      }
    `,
  ],
})
export class LanguagesMenuComponent {
  private readonly _translate = inject(TranslateService);

  /** The languages chosen; none (`null`) follows the app language. */
  readonly chosen = model<string[] | null>(null);
  readonly cyPrefix = input('data-model');

  readonly languages = DESCRIPTION_LANGUAGES;
  private readonly _appLanguage = toSignal(
    this._translate.onLangChange.pipe(
      map(change => change.lang),
      startWith(this._translate.currentLang)
    ),
    { initialValue: this._translate.currentLang }
  );
  /** The app language, or English when it has no texts of its own. */
  readonly appLanguage = computed(() => {
    const language = this._appLanguage() ?? '';
    return DESCRIPTION_LANGUAGES.includes(language) ? language : DESCRIPTION_LANGUAGES[0];
  });
  readonly ticked = computed(() => this.chosen() ?? [this.appLanguage()]);
  readonly allTicked = computed(() => this.ticked().length === DESCRIPTION_LANGUAGES.length);
  readonly label = computed(() => {
    const ticked = this.ticked();
    return ticked.length === DESCRIPTION_LANGUAGES.length
      ? this._translate.instant('pages.dataModels2.allLanguagesShort')
      : ticked.join(', ');
  });

  nameOf(language: string): string {
    return NAMES.get(language) ?? language;
  }

  /** Ticks every language, or with all ticked goes back to the app language alone, which it follows again. */
  toggleAll(): void {
    this.chosen.set(this.allTicked() ? null : [...DESCRIPTION_LANGUAGES]);
  }

  /** Ticks or unticks a language, keeping at least one; the choice no longer follows the app language. */
  toggle(language: string): void {
    const ticked = this.ticked();
    const next = ticked.includes(language) ? ticked.filter(other => other !== language) : [...ticked, language];
    if (next.length) this.chosen.set(DESCRIPTION_LANGUAGES.filter(other => next.includes(other)));
  }
}
