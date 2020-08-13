import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ProjectsResponse, ReadProject, UserResponse, StoredProject } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { AdminPermissions } from 'src/app/main/declarations/admin-permissions';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { CacheService } from '../../main/cache/cache.service';

/**
 * projects component handles the list of projects
 * It's used in user-profile, on system-projects
 * but also on the landing page
 *
 * We build to lists: one with active projects
 * and another one with already deactivate (inactive) projects
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
    active: StoredProject[] = [];
    // list of archived (deleted) projects
    inactive: StoredProject[] = [];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _session: SessionService,
        private _dialog: MatDialog,
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

        this.session = this._session.getSession();

        this.initList();
    }

    initList() {
        this.loading = true;

        // clean up list of projects
        this.active = [];
        this.inactive = [];

        if (this.username) {
            // logged-in user view: get all projects, where the user is member of
            this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
                (response: ApiResponseData<UserResponse>) => {

                    for(let project of response.body.user.projects) {
                        if (project.status === true) {
                            this.active.push(project);
                        } else {
                            this.inactive.push(project);
                        }
                    }

                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        } else {

            // logged-in user is system admin (or guest): show all projects
            this._dspApiConnection.admin.projectsEndpoint.getProjects().subscribe(
                (response: ApiResponseData<ProjectsResponse>) => {

                    // reset the lists:
                    this.active = [];
                    this.inactive = [];

                    for (const item of response.body.projects) {
                        if (item.status === true) {
                            this.active.push(item);
                        } else {
                            this.inactive.push(item);
                        }
                    }

                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        }
    }

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

        dialogRef.afterClosed().subscribe(response => {
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
