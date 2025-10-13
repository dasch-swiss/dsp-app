import { Component } from '@angular/core';

@Component({
  selector: 'app-project-search-page',
  template: ` <app-project-fulltext-search-page /> `,
  styles: [
    `
      :host {
        display: block;
        padding: 16px;
      }
    `,
  ],
  standalone: false,
})
export class ProjectSearchPageComponent {}
