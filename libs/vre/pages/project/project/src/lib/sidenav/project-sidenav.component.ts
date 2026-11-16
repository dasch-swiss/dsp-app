import { Component } from '@angular/core';
import { ProjectSidenavOntologiesComponent } from './project-sidenav-ontologies.component';

@Component({
  selector: 'app-project-sidenav',
  template: ` <app-projects-sidenav-ontologies /> `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        box-sizing: border-box;
        border-right: 1px solid #e5e7eb; /* $cool_gray_200 */
        overflow: auto;
      }
    `,
  ],
  imports: [ProjectSidenavOntologiesComponent],
})
export class ProjectSidenavComponent {}
