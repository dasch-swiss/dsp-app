import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
    ApiResponseError,
    ReadProject
} from '@dasch-swiss/dsp-js';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent implements OnInit {
    // loading for progress indicator
    loading = true;

    // permissions of the logged-in user
    session: Session;
    userHasPermission = false;

    // project uuid coming from the route
    projectUuid: string;

    // project data to be displayed
    project: ReadProject;

    constructor(
        private _errorHandler: AppErrorHandler,
        private _session: SessionService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _applicationStateService: ApplicationStateService
    ) {
        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });
    }

    ngOnInit() {

        // get information about the logged-in user, if one is logged-in
        this.session = this._session.getSession();
        this.userHasPermission = this.session?.user?.sysAdmin; // if the user is sysadmin, he has the permission to edit the project

        // get project info from backend
        this.initProject();
    }

    /**
     * initProject: get the project data from the application state service and update
     * if the user has permission to edit the project if not a sysadmin
     */
    initProject() {
        // get the project data
        this._applicationStateService.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // if the user is not sysadmin, check if he is project admin
                if (!this.userHasPermission) {
                    this.userHasPermission = this.session.user.projectAdmin.some(
                        (e) => e === this.project.id
                    );
                }
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
        this.loading = false;
    }

    editProject() {
        this._router.navigate(['project', this.projectUuid, 'edit']);
    }
}
