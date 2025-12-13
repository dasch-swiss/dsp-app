import { Component } from '@angular/core';
import { ProjectFulltextSearchPageComponent } from './project-fulltext-search-page.component';

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
  imports: [ProjectFulltextSearchPageComponent],
})
export class ProjectSearchPageComponent {}
