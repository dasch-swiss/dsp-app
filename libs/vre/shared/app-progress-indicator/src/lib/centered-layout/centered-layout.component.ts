import { Component } from '@angular/core';

@Component({
  selector: 'dasch-swiss-centered-layout',
  template: '<div class="child"><ng-content></ng-content></div>',
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
      }

      .child {
        margin: 16px 0;
        width: 100%;
        max-width: 800px;
      }
    `,
  ],
})
export class CenteredLayoutComponent {}
