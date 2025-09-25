import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-centered-layout',
  template: '<div class="content large middle"><ng-content  /></div>',
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CenteredLayoutComponent {}
