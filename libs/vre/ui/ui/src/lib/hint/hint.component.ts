import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hint',
  template: `
    <div class="hint">
      <p>Use special syntax:</p>
      <ul>
        <li>
          question mark<strong>?</strong> can be used as wildcard symbol for a single character.<br />
          <code>Example: <i>be?r</i> will find <i>beer</i> but also <i>bear</i></code>
        </li>
        <br />
        <li>
          asterisk<strong>*</strong> can be used as a wildcard symbol for zero, one or multiple characters.<br />
          <code>Example: <i>b*r</i> will find <i>beer</i> but also <i>bear</i></code>
        </li>
        <br />
        <li>
          <strong>"</strong>quotation marks<strong>"</strong> searches for the whole pattern.<br />
          <code class="">Example: <i>"Lorem ipsum"</i> will find texts with exact content <i>Lorem ipsum</i></code>
        </li>
      </ul>
    </div>

    <a mat-button href="https://docs.dasch.swiss/latest/DSP-APP/user-guide/data/search" target="_blank" color="primary">
      Read more in the user guide
      <mat-icon class="suffix">launch</mat-icon>
    </a>
  `,
  styleUrls: ['./hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintComponent {}
