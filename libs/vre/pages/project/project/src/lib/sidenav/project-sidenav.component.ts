import { Component } from '@angular/core';
import { ProjectPageService } from '../project-page.service';

@Component({
  selector: 'app-project-sidenav',
  template: `
    @if (currentProject$ | async; as currentProject) {
      <div class="project-title">{{ currentProject.longname }}</div>
    }
    <mat-divider />
    <app-projects-sidenav-links />
    <mat-divider />
    <app-projects-sidenav-ontologies />
  `,
  styles: [
    `
      :host {
        width: 290px;
        display: block;
      }

      .project-title {
        padding: 20px 16px 20px 16px;
        font-size: 24px;
        margin: 0;
      }
    `,
  ],
  standalone: false,
})
export class ProjectSidenavComponent {
  currentProject$ = this._projectPageService.currentProject$;

  constructor(private _projectPageService: ProjectPageService) {}
}
