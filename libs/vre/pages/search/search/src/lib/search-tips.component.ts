import { Component } from '@angular/core';

@Component({
  selector: 'app-search-tips',
  template: ` <div
    style="
    width: 100%;
    border-radius: 5px;
    background: white;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e0e0e0;">
    Search tips
    <ul>
      <li>Use quotation marks for exact phrases: "down the rabbit hole"</li>
      <li>Use AND, OR, NOT for boolean searches: Alice AND Wonderland</li>
      <li>Use wildcards: Alice* will match Alice, Alices, etc.</li>
    </ul>
  </div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      li {
        margin-bottom: 8px;
      }
    `,
  ],
  standalone: false,
})
export class SearchTipsComponent {}
