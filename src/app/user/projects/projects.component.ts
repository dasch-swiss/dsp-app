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

    sysAdmin: boolean = false;

    projects: Project[] = [];
    active: Project[] = [];
    inactive: Project[] = [];


    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your projects');
    }

    ngOnInit() {
        this.getProjects(this.username);

        if (this.sysAdmin) {
            this.getProjects();
        }
    }

    getProjects(name?: string) {

        this.loading = true;

        const session: Session = JSON.parse(localStorage.getItem('session'));

        // this.sysAdmin = (!this.username && (session && session.user.sysAdmin));

        if (!name && (session && session.user.sysAdmin)) {
            // the logged-in user is system administrator;
            // he has access to every project
            this._projectsService.getAllProjects()
                .subscribe(
                    (projects: Project[]) => {
                        this.projects = projects;
                        for (const p of this.projects) {

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
        } else {
            // the logged-in user has no system admin rights;
            // he get only his own projects

            name = (name ? name : session.user.name);

            this._cache.get(this.username, this._usersService.getUser(name)).subscribe(
                (user: User) => {
                    this.projects = user.projects;

                    for (const p of this.projects) {
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
