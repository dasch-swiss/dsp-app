import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-footnote-tooltip',
  template: ` <div class="content" [@fadeIn]="'in'">
    <div [innerHTML]="content"></div>
  </div>`,
  animations: [
    trigger('fadeIn', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [style({ opacity: 0 }), animate(100)]),
    ]),
  ],
  styles: [
    `
      :host {
        position: absolute;
        z-index: 1000;
      }

      .content {
        font-size: 0.8em;
        background: white;
        color: black;
        padding: 8px;
        min-width: 200px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class FootnoteTooltipComponent {
  @Input({ required: true }) content!: SafeHtml;
}
