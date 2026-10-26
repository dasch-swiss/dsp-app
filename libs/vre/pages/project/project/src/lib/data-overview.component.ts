import { Component } from '@angular/core';
import { ProjectShortDescriptionComponent } from './description/project-short-description.component';

@Component({
  selector: 'app-data-overview',
  template: `<app-project-short-description class="card" />`,
  styles: [
    `
      :host {
        display: block;
        padding: 100px 16px 0;
        text-align: center;
      }

      .card {
        display: block;
        box-sizing: border-box;
        width: 100%;
        max-width: 760px;
        margin: 40px auto 0;
        padding-bottom: 16px;
        border: 1px solid #ebebeb;
      }
    `,
  ],
  imports: [ProjectShortDescriptionComponent],
})
export class DataOverviewComponent {}
