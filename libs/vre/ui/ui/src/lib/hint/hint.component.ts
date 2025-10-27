import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hint',
  template: `
    <div class="hint">
      <p>{{ 'ui.hint.useSpecialSyntax' | translate }}</p>
      <ul>
        <li [innerHTML]="'ui.hint.questionMark' | translate"></li>
        <br />
        <li [innerHTML]="'ui.hint.asterisk' | translate"></li>
        <br />
        <li [innerHTML]="'ui.hint.quotationMarks' | translate"></li>
      </ul>
    </div>

    <a mat-button href="https://docs.dasch.swiss/latest/DSP-APP/user-guide/data/search" target="_blank" color="primary">
      {{ 'ui.hint.readMore' | translate }}
      <mat-icon class="suffix">launch</mat-icon>
    </a>
  `,
  styleUrls: ['./hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HintComponent {}
