import { Component, OnInit } from '@angular/core';
import { ProjectsService, Project, ApiServiceError } from '@knora/core';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.component.html',
  styleUrls: ['./project-menu.component.scss']
})
export class ProjectMenuComponent implements OnInit {

    projects: Project[];

    label: string = 'Project';

    constructor(private _projectsService: ProjectsService) { }

    ngOnInit() {
      this._projectsService.getAllProjects().subscribe(
        (projects: Project[]) => {
            this.projects = projects;

            // this.loadSystem = false;
        },
        (error: ApiServiceError) => {
            console.error(error);
        }
    );
    }

    setProject(name: string) {
      this.label = name;

    }

}
