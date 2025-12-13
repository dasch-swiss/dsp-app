import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-alternated-list',
  template: ` <div class="container">
    <ng-content />
  </div>`,
  styles: [
    `
      :host ::ng-deep {
        .container {
          max-height: 400px;
          min-width: 400px;
          overflow-y: auto;
        }

        .container > * {
          padding: 16px 8px;
          border: 1px solid #f2f2f2;
          border-bottom-width: 0;

          &:last-child {
            border-bottom-width: 1px;
          }

          &:nth-child(odd) {
            background-color: #f2f2f2;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlternatedListComponent {}
