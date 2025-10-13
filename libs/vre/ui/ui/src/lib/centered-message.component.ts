import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-centered-message',
  template: `
    @if (icon) {
      <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: #9e9e9e">{{ icon }}</mat-icon>
    }
    @if (title) {
      <h2 style="font-weight: 400">{{ title }}</h2>
    }
    @if (message) {
      <p style="margin: 16px 0 24px; color: #757575; max-width: 400px">{{ message }}</p>
    }
  `,
  styles: [
    `
      :host {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `,
  ],
  standalone: false,
})
export class CenteredMessageComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() message?: string;
}
