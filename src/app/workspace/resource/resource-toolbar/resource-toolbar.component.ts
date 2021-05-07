import { Component, EventEmitter, Inject, Input, OnChanges, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ReadProject, ReadResource, ReadUser, UserResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, NotificationService, UserService } from '@dasch-swiss/dsp-ui';

@Component({
    selector: 'app-resource-toolbar',
    templateUrl: './resource-toolbar.component.html',
    styleUrls: ['./resource-toolbar.component.scss']
})
export class ResourceToolbarComponent implements OnChanges {

    @Input() resource: ReadResource;

    @Input() showAllProps = false;

    @Output() toggleProps: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * output `referredProjectClicked` of resource view component:
     * can be used to go to project page
     */
    @Output() referredProjectClicked: EventEmitter<ReadProject> = new EventEmitter<ReadProject>();

    /**
     * output `referredProjectHovered` of resource view component:
     * can be used for preview when hovering on project
     */
    @Output() referredProjectHovered: EventEmitter<ReadProject> = new EventEmitter<ReadProject>();

    project: ReadProject;
    user: ReadUser;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _snackBar: MatSnackBar,
        private _userService: UserService
    ) { }

    ngOnChanges() {
        // get project information
        this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(this.resource.attachedToProject).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        );

        // get user information
        this._userService.getUser(this.resource.attachedToUser).subscribe(
            (response: UserResponse) => {
                this.user = response.user;
            }
        );
    }

    /**
     * emits the project information on click.
     */
    projectClicked(project: ReadProject) {
        this.referredProjectClicked.emit(project);
    }

    /**
     * emits the project information on hover.
     */
    projectHovered(project: ReadProject) {
        this.referredProjectHovered.emit(project);
    }

    /**
     * display message to confirm the copy of the citation link (ARK URL)
     */
    openSnackBar() {
        const message = 'Copied to clipboard!';
        const action = 'Citation Link';
        this._snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }
}
