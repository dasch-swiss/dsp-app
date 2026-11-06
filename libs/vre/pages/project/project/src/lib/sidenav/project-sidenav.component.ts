import { Component } from '@angular/core';
import { ProjectSidenavOntologiesComponent } from './project-sidenav-ontologies.component';

@Component({
  selector: 'app-project-sidenav',
  template: ` <app-projects-sidenav-ontologies /> `,
  styles: [
    `
      /* As libs/vre/ui/styles/_material-icons.scss: a Sass stylesheet using config carries it. */
      .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
      }

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
