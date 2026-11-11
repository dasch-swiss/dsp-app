import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { DESCRIPTION_LANGUAGES } from './description-editor.component';

/** The languages a table shows, as stored: every one, or none chosen (`null`), which follows the app language. */
export function parseLanguages(stored: string): string[] | null {
  try {
    const languages = JSON.parse(stored);
    if (!Array.isArray(languages)) return null;
    return DESCRIPTION_LANGUAGES.every(language => languages.includes(language)) ? [...DESCRIPTION_LANGUAGES] : null;
  } catch {
    return null;
  }
}

/**
 * The languages the names and descriptions of a table show in: the current language, the app's (by default), or all
 * of them, stacked and labelled.
 */
@Component({
  selector: 'app-languages-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatButtonToggle, MatButtonToggleGroup, MatIcon, MatMenu, MatMenuTrigger, TranslatePipe],
  template: `
    @let r = 'pages.dataModels2';
    <button
      mat-stroked-button
      type="button"
      class="languages"
      [attr.data-cy]="cyPrefix() + '-languages'"
      [attr.aria-label]="(r + '.languages' | translate) + ': ' + label()"
      [matMenuTriggerFor]="menu">
      <mat-icon>translate</mat-icon>
      <b [class.code]="!all()">{{ label() }}</b>
      <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <!-- The menu stays open on a choice; Escape closes it. -->
      <div
        class="menu"
        (click)="$event.stopPropagation()"
        (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
        <span class="heading">{{ r + '.languages' | translate }}</span>
        <mat-button-toggle-group
          class="choice"
          hideSingleSelectionIndicator
          [attr.aria-label]="r + '.languages' | translate"
          [value]="all() ? 'all' : 'current'"
          (change)="choose($event.value)">
          <mat-button-toggle value="current" [attr.data-cy]="cyPrefix() + '-language-current'">
            {{ r + '.currentLanguage' | translate }}
          </mat-button-toggle>
          <mat-button-toggle value="all" [attr.data-cy]="cyPrefix() + '-language-all'">
            {{ r + '.allLanguages' | translate }}
          </mat-button-toggle>
        </mat-button-toggle-group>
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

          &.code {
            text-transform: uppercase;
          }
        }
      }

      .menu {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 4px 12px 8px;
      }

      .heading {
        padding: 4px 0;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7280;
      }

      .choice {
        --mat-button-toggle-height: 34px;
        --mat-button-toggle-label-text-size: 13px;
        white-space: nowrap;
      }
    `,
  ],
})
export class LanguagesMenuComponent {
  private readonly _translate = inject(TranslateService);

  /** Every language, or none (`null`): the app's. */
  readonly chosen = model<string[] | null>(null);
  readonly cyPrefix = input('data-model');

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
  readonly all = computed(() => (this.chosen()?.length ?? 0) === DESCRIPTION_LANGUAGES.length);
  readonly label = computed(() =>
    this.all() ? this._translate.instant('pages.dataModels2.allLanguagesShort') : this.appLanguage()
  );

  choose(choice: 'current' | 'all'): void {
    this.chosen.set(choice === 'all' ? [...DESCRIPTION_LANGUAGES] : null);
  }
}
