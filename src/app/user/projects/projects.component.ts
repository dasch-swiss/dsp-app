import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Session } from '@knora/authentication';
import { ApiServiceError, Project, ProjectsService, User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { projection } from '@angular/core/src/render3';

@Component({
    selector: 'app-projects',
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

    @Input() username?: string;

    @Input() system?: boolean = true;

    session: Session;

    projects: Project[] = [];
    loadProjects: boolean;

    systemProjects: Project[];
    loadSystem: boolean;

    ownProfile: boolean = false;

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        if (this.system) {
            this._titleService.setTitle('All projects from Knora');
        } else {
            this._titleService.setTitle('Your projects');
        }

    }

    ngOnInit() {

        if (this.username) {
            this.loadProjects = true;
            // get user's projects
            this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
                (user: User) => {
                    // because of a knora cache issue, we have to make additional requests for each project

                    let i: number = 0;
                    for (const project of user.projects) {
                        console.log(project.id);

                        this._projectsService.getProjectByIri(project.id).subscribe(
                            (projectResponse: Project) => {
                                this.projects.push(projectResponse);
                                console.log(i);
                                console.log(this.projects);

                            },
                            (projectError: ApiServiceError) => {
                                console.error(projectError);
                            }
                        );
                        i++;

                    }

                    setTimeout(() => {
                        // console.log(this.resource);
                        this.loadProjects = false;
                    }, 1000);

                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }

        // check if the logged-in user is system admin
        this.session = JSON.parse(localStorage.getItem('session'));

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
