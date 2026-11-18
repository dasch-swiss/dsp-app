import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { MULTI_LANGUAGE_MODE } from './multi-language-mode';

/**
 * Picks how the multilingual texts of a form show their languages: one at a time, under a row of language tabs, or
 * all at once. Every `app-multi-language-fields` follows it, and the choice is remembered in this browser. A display
 * setting rather than a field, it sits in the form's action bar, on the left of its buttons.
 */
@Component({
  selector: 'app-multi-language-mode-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggle, MatButtonToggleGroup, MatIcon, MatTooltip, TranslatePipe],
  template: `
    <mat-icon class="icon" aria-hidden="true" [matTooltip]="'ui.multiLanguage.languages' | translate"
      >translate</mat-icon
    >
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
      // On the left of the action bar: the buttons keep the right.
      :host {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-right: auto;
        --mat-button-toggle-height: 28px;
        --mat-button-toggle-label-text-size: 12px;
      }

      // In a dialog's action bar, which is padded less than the content: in line with the fields above.
      :host-context(.mat-mdc-dialog-actions) {
        margin-left: 16px;
      }

      .icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: rgba(0, 0, 0, 0.54);
      }
    `,
  ],
})
export class MultiLanguageModeSwitchComponent {
  readonly mode = MULTI_LANGUAGE_MODE;
}
