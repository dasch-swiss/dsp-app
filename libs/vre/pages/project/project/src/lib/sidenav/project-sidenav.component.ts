import { Component } from '@angular/core';

@Component({
  selector: 'app-project-sidenav',
  template: ` <app-projects-sidenav-ontologies /> `,
  styles: [
    `
      :host {
        flex-basis: 600px;
        flex-shrink: 0;
        display: block;
        border-right: 1px solid #ebebeb;
        overflow: auto;
      }
    `,
  ],
  standalone: false,
})
export class ProjectSidenavComponent {}
