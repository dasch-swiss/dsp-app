import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Session } from '@knora/authentication';
import {
    ApiServiceError,
    Project,
    ProjectsService,
    User,
    UsersService
} from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { AdminPermissions } from 'src/app/main/declarations/admin-permissions';

/**
 * projects component handles the list of projects
 * It's used in user-profile, on system-projects
 * but also on the landing page
 *
 * We build to lists: one with active projects
 * and another one with already archived (inactive) projects
 *
 */
@Component({
    selector: 'app-projects',
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

    /**
     * general variables
     */
    loading: boolean;
    error: any;

    /**
     * if username is definded: show only projects,
     * where this user is member of;
     * otherwise show all projects
     */
    @Input() username?: string;

    // do we still need this? NO!
    @Input() system?: boolean = true;

    /**
     * who is logged-in? does he have project-admin, system-admin or no rights?
     * get the information from localstorage
     */
    session: Session;

    permissions: AdminPermissions;

    // list of active projects
    active: Project[] = [];
    // list of archived (deleted) projects
    inactive: Project[] = [];

    constructor (
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _usersService: UsersService,
        private _titleService: Title
    ) {
        // set the page title
        if (this.username) {
            this._titleService.setTitle('Your projects');
        } else {
            this._titleService.setTitle('All projects from Knora');
        }
    }

    ngOnInit() {

        this.session = JSON.parse(localStorage.getItem('session'));

        this.initList();
    }

    initList() {
        this.loading = true;

        // clean up list of projects
        this.active = [];
        this.inactive = [];

        if (this.username) {
            // logged-in user view: get all projects, where the user is member of
            this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
                (user: User) => {

                    // get user's projects by iri
                    for (const project of user.projects) {
                        this._projectsService
                            .getProjectByIri(project.id)
                            .subscribe(
                                (projectResponse: Project) => {
                                    // this.projects.push(projectResponse);
                                    if (projectResponse.status === true) {
                                        this.active.push(projectResponse);
                                    } else {
                                        this.inactive.push(projectResponse);
                                    }
                                },
                                (projectError: ApiServiceError) => {
                                    console.error(projectError);
                                }
                            );
                    }

                    this.loading = false;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        } else {

            // logged-in user is system admin (or guest): show all projects
            this._projectsService.getAllProjects().subscribe(
                (projects: Project[]) => {

                    // reset the lists:
                    this.active = [];
                    this.inactive = [];

                    for (const item of projects) {
                        if (item.status === true) {
                            this.active.push(item);
                        } else {
                            this.inactive.push(item);
                        }
                    }

                    this.loading = false;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }
    }
    /*
        initListBak() {
            if (this.username) {
                // get user's projects
                this._cache
                    .get(
                        this.username,
                        this._usersService.getUserByUsername(this.username)
                    )
                    .subscribe(
                        (user: User) => {
                            // because of a knora cache issue, we have to make additional requests for each project

                            let i: number = 0;
                            for (const project of user.projects) {
                                this._projectsService
                                    .getProjectByIri(project.id)
                                    .subscribe(
                                        (projectResponse: Project) => {
                                            // this.projects.push(projectResponse);

                                            for (const item of this.projects) {
                                                if (item.status === true) {
                                                    this.active.push(item);
                                                } else {
                                                    this.inactive.push(item);
                                                }
                                            }
                                        },
                                        (projectError: ApiServiceError) => {
                                            console.error(projectError);
                                        }
                                    );
                                i++;
                            }

                            setTimeout(() => {
                                // console.log(this.resource);
                                this.loading = false;
                            }, 500);
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
            } else {
                // system view if logged-in user is system admin
            }

            // check if the logged-in user is system admin
            this.session = JSON.parse(localStorage.getItem('session'));

            if (this.session.user.sysAdmin) {
                this.loadSystem = true;
                // the logged-in user is system administrator
                // additional, get all projects
                this._projectsService.getAllProjects().subscribe(
                    (projects: Project[]) => {
                        // this.systemProjects = projects;

                        for (const item of this.projects) {
                            if (item.status === true) {
                                this.active.push(item);
                            } else {
                                this.inactive.push(item);
                            }
                        }

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
            }

            if (this.session && this.username === this.session.user.name) {
                this.ownProfile = true;

                if (this.session.user.sysAdmin) {
                    this.loadSystem = true;
                    // the logged-in user is system administrator
                    // additional, get all projects
                    this._projectsService.getAllProjects().subscribe(
                        (projects: Project[]) => {
                            this.systemProjects = projects;

                            for (const item of this.projects) {
                                if (item.status === true) {
                                    this.active.push(item);
                                } else {
                                    this.inactive.push(item);
                                }
                            }

                            this.loadSystem = false;
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
                }
            }
        }
     */
    openDialog(mode: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { mode: mode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
        });
    }

    /**
     * refresh list of projects after updating one
     */
    refresh(): void {
        // referesh the component
        this.loading = true;
        // update the cache
        // this._cache.del('members_of_' + this.projectcode);
        this.initList();

        // refresh child component: add user
        /*
        if (this.addUser) {
            this.addUser.buildForm();
        }
        */
    }
}
