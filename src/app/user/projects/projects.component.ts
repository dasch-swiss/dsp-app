import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiServiceError, Project, ProjectsService, Session, User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-projects',
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

    @Input() username?: string;

    session: Session;

    projects: Project[];
    loadProjects: boolean;

    systemProjects: Project[];
    loadSystem: boolean;

    ownProfile: boolean = false;

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your projects');
    }

    ngOnInit() {

        if (this.username) {
            this.loadProjects = true;
            // get user's projects
            this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
                (user: User) => {

                    this.projects = user.projects;

                    this.loadProjects = false;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }

        // check if the logged-in user is system admin
        this.session = JSON.parse(localStorage.getItem('session'));

        if (this.session && (this.username === this.session.user.name)) {
            this.ownProfile = true;

            if (this.session.user.sysAdmin) {

                this.loadSystem = true;
                // the logged-in user is system administrator
                // additional, get all projects
                this._projectsService.getAllProjects()
                    .subscribe(
                        (projects: Project[]) => {
                            this.systemProjects = projects;

                            this.loadSystem = false;
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
            }
        }





    }


}
