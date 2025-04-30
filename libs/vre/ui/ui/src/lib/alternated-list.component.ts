import { Component } from '@angular/core';

@Component({
  selector: 'app-alternated-list',
  template: ` <div class="test" style="max-height: 400px; min-width:400px; overflow-y: auto">
    <ng-content />
  </div>`,
  styles: [
    `
      :host ::ng-deep {
        .test > * {
          padding: 16px 8px;
          border: 1px solid #f2f2f2;
          border-bottom-width: 0;

          &:last-child {
            border-bottom-width: 1px;
          }

          &:nth-child(odd) {
            background-color: #f2f2f2;
          }

          &:nth-child(odd) {
            background-color: white;
          }
        }
      }
    `,
  ],
})
export class AlternatedListComponent {}
