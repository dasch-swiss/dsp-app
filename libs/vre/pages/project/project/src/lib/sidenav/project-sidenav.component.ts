import { Component } from '@angular/core';
import { ProjectSidenavOntologiesComponent } from './project-sidenav-ontologies.component';

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
  standalone: true,
  imports: [ProjectSidenavOntologiesComponent],
})
export class ProjectSidenavComponent {}
