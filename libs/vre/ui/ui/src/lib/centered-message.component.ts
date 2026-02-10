import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-centered-message',
  host: {
    '[style.--color]': 'color',
  },
  template: `
    @if (icon) {
      <mat-icon style="font-size: 64px; width: 64px; height: 64px">{{ icon }}</mat-icon>
    }
    @if (title) {
      <h2 style="font-weight: 400; margin-bottom: 0">{{ title }}</h2>
    }
    @if (message) {
      <p style="margin: 16px 0 24px; max-width: 400px">{{ message }}</p>
    }
  `,
  styles: [
    `
      :host {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--color);
      }
    `,
  ],
  imports: [MatIconModule],
})
export class CenteredMessageComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() message?: string;
  @Input() color? = '#757575';
}
