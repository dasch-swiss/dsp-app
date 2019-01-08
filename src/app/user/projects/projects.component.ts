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

    loading: boolean;

    @Input() username?: string;

    session: Session;
    sysAdmin: boolean = false;

    active: Project[] = [];
    inactive: Project[] = [];

    systemActive: Project[] = [];
    systemInactive: Project[] = [];

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your projects');
    }

    ngOnInit() {
        this.getProjects(this.username);

        this.session = JSON.parse(localStorage.getItem('session'));

        if ((this.username === this.session.user.name) && this.session.user.sysAdmin) {
            // the logged-in user is system administrator
            // additional, get all projects
            this.getProjects();
        }
    }

    getProjects(name?: string) {
        this.loading = true;

        if (!name) {
            // the logged-in user is system administrator;
            // he has access to every project
            this._projectsService.getAllProjects()
                .subscribe(
                    (projects: Project[]) => {
                        for (const p of projects) {

                            if (p.status === true) {
                                this.systemActive.push(p);
                            } else {
                                this.systemInactive.push(p);
                            }
                        }

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        } else {
            // the logged-in user has no system admin rights;
            // he get only his own projects

            this._cache.get(this.username, this._usersService.getUser(name)).subscribe(
                (user: User) => {

                    for (const p of user.projects) {
                        if (p.status === true) {
                            this.active.push(p);
                        } else {
                            this.inactive.push(p);
                        }
                    }

                    this.loading = false;

                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );

        }

        // TODO: in case of sys admin: is it possible to mix all projects with user's projects to mark them somehow in the list?!
    }

}
