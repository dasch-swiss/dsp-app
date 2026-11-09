import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-tips',
  template: ` <div class="search-tips">
    {{ 'pages.search.searchTips.title' | translate }}
    <ul>
      <li>{{ 'pages.search.searchTips.exactPhrases' | translate }}</li>
      <li>{{ 'pages.search.searchTips.booleanSearch' | translate }}</li>
      <li>{{ 'pages.search.searchTips.wildcards' | translate }}</li>
    </ul>
  </div>`,
  styles: [
    `
      /* No width of its own on the host: with the padding a host puts around it, 100% overflowed the page,
         which brought up scrollbars and made the Search tab jump (DEV-7483). */
      :host {
        display: block;
      }
      .search-tips {
        box-sizing: border-box;
        width: 570px;
        max-width: 100%;
        border-radius: 5px;
        background: white;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid #e0e0e0;
      }
      li {
        margin-bottom: 8px;
      }
    `,
  ],
  imports: [TranslatePipe],
})
export class SearchTipsComponent {}
