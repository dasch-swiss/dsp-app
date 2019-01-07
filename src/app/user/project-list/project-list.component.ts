import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, Session, User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {

    loading: boolean;

    @Input() username?: string;

    sysAdmin: boolean = false;

    projects: Project[] = [];
    active: Project[] = [];
    inactive: Project[] = [];

    // i18n setup
    itemPluralMapping = {
        'project': {
            '=1': 'Project',
            'other': 'Projects'
        }
    };

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _router: Router,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        // this._titleService.setTitle('Your projects');
    }

    ngOnInit() {

        if (this.username) {
            // get user specific projects
            this.getUsersProjects(this.username);
        } else {
            // get logged in user projects
            this.getUsersProjects();
        }

    }

    getUsersProjects(name?: string) {

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


                    console.log(this.active.length);

                    this.loading = false;

                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );

        }

        // TODO: in case of sys admin: is it possible to mix all projects with user's projects to mark them somehow in the list?!
    }

    /**
     *
     * @param id
     */
    setProject(id: string) {
        // get project by id
        // by searching in the list of projects
        // instead of an additional api request
        this.projects.filter(project => {

            if (project.id === id) {

                this._router.navigateByUrl('/refresh', {skipLocationChange: true}).then(() =>
                    this._router.navigate(['/project/' + project.shortcode])
                );

                // this._router.navigate(['/project/' + project.shortname + '/dashboard']);

                // location.reload(true);
            }
        });
    }
}
