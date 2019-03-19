import { Component, OnInit } from '@angular/core';
import { ProjectsService, Project, ApiServiceError } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-project-menu',
    templateUrl: './project-menu.component.html',
    styleUrls: ['./project-menu.component.scss']
})
export class ProjectMenuComponent implements OnInit {

    loading: boolean = true;
    projects: Project[];
    label: string = 'Project';

    constructor(
        private _cache: CacheService,
        private _projectsService: ProjectsService
    ) {}

    ngOnInit() {
        this._projectsService.getAllProjects().subscribe(
            (projects: Project[]) => {
                this.projects = projects;
                // this.loadSystem = false;
                if (localStorage.getItem('currentProject') !== null) {
                    this.label = JSON.parse(
                        localStorage.getItem('currentProject')
                    ).shortname;
                }
                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
    }

    /**
     * set current selected project by project shortcode
     *
     * @param code project shortcode
     */
    setProject(project?: Project) {
        if (!project) {
            // set default project: none
            this.label = 'Project';
            localStorage.removeItem('currentProject');
        } else {
            this.label = project.shortname;
            // get project by shortname
            localStorage.setItem('currentProject', JSON.stringify(project));
            // set the prject cache
            this._cache.get(
                project.shortcode,
                this._projectsService.getProjectByShortcode(project.shortcode)
            );
        }
    }
}
