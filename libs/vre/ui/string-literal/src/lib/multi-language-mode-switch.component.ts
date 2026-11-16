import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { MULTI_LANGUAGE_MODE } from './multi-language-mode';

/**
 * Picks how the multilingual texts of a form show their languages: one at a time, under a row of language tabs, or
 * all at once. Every `app-multi-language-fields` follows it, and the choice is remembered in this browser.
 */
@Component({
  selector: 'app-multi-language-mode-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggle, MatButtonToggleGroup, TranslatePipe],
  template: `
    <span class="title">{{ 'ui.multiLanguage.languages' | translate }}</span>
    <mat-button-toggle-group
      hideSingleSelectionIndicator
      data-cy="multi-language-mode"
      [attr.aria-label]="'ui.multiLanguage.languages' | translate"
      [value]="mode()"
      (change)="mode.set($event.value)">
      <mat-button-toggle value="one" data-cy="multi-language-mode-one">{{
        'ui.multiLanguage.oneAtATime' | translate
      }}</mat-button-toggle>
      <mat-button-toggle value="all" data-cy="multi-language-mode-all">{{
        'ui.multiLanguage.allLanguages' | translate
      }}</mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin: 4px 0 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        --mat-button-toggle-height: 32px;
        --mat-button-toggle-label-text-size: 13px;
      }

      .title {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.6);
      }
    `,
  ],
})
export class MultiLanguageModeSwitchComponent {
  readonly mode = MULTI_LANGUAGE_MODE;
}
