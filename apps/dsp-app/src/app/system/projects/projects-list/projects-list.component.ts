import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ProjectResponse,
    StoredProject,
    UpdateProjectRequest,
} from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import {DspApiConnectionToken, RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { SortingService } from '@dsp-app/src/app/main/services/sorting.service';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import {SortProp} from "@dsp-app/src/app/main/action/sort-button/sort-button.component";
import {Subscription} from "rxjs";
import {tap} from "rxjs/operators";

@Component({
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent implements OnInit {
    // list of users: status active or inactive (deleted)
    @Input() status: boolean;

    // list of projects: depending on the parent
    @Input() list: StoredProject[];

    // enable the button to create new project
    @Input() createNew = false;

    // in case of modification
    @Output() refreshParent: EventEmitter<void> = new EventEmitter<void>();

    // loading for progess indicator
    loading: boolean;

    // permissions of the logged-in user
    session: Session;
    sysAdmin = false;

    // list of default, dsp-specific projects, which are not able to be deleted or to be editied
    doNotDelete: string[] = [
        Constants.SystemProjectIRI,
        Constants.DefaultSharedOntologyIRI,
    ];

    // i18n plural mapping
    itemPluralMapping = {
        project: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': '1 Project',
            other: '# Projects',
        },
    };

    // sort properties
    sortProps: SortProp[] = [
        {
            key: 'shortcode',
            label: 'Short code',
        },
        {
            key: 'shortname',
            label: 'Short name',
        },
        {
            key: 'longname',
            label: 'Project name',
        },
    ];

    sortBy = 'longname'; // default sort by

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _errorHandler: AppErrorHandler,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _sortingService: SortingService,
        private _projectService: ProjectService
    ) {}

    ngOnInit() {
        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session?.user?.sysAdmin;

        // sort list by defined key
        this.sortBy = localStorage.getItem('sortProjectsBy') || this.sortBy;
        this.sortList(this.sortBy);
    }

    /**
     * return true, when the user is entitled to edit a project. This is
     * the case when a user either system admin or project admin of the given project.
     *
     * @param  projectId the iri of the project to be checked
     */
    userHasPermission(projectId: string): boolean {
        return this.sysAdmin || this.userIsProjectAdmin(projectId);
    }

    /**
     * return true, when the user is project admin of the given project.
     *
     * @param  projectId the iri of the project to be checked
     */
    userIsProjectAdmin(projectId: string): boolean {
        return this.session?.user.projectAdmin.some((e) => e === projectId);
    }

    /**
     * navigate to the project pages (e.g. board, collaboration or ontology)
     *
     * @param iri
     */
    openProjectPage(iri: string) {
        const uuid = this._projectService.iriToUuid(iri);

        this._router
            .navigateByUrl(`/${RouteConstants.refresh}`, { skipLocationChange: true })
            .then(() => this._router.navigate([RouteConstants.project, uuid]));
    }

    createNewProject() {
        this._router.navigate([RouteConstants.project, RouteConstants.createNew]);
    }

    editProject(iri: string) {
        const uuid = this._projectService.iriToUuid(iri);
        this._router.navigate([RouteConstants.project, uuid, RouteConstants.edit]);
    }

    openDialog(mode: string, name?: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px',
            },
            data: { name: name, mode: mode, project: id },
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((response) => {
            if (response === true) {
                // get the mode
                switch (mode) {
                    case 'deactivateProject':
                        this.deactivateProject(id);
                        break;

                    case 'activateProject':
                        this.activateProject(id);
                        break;
                }
            }
        });
    }

    sortList(key: any) {
        if (!this.list) { // guard
            return;
        }
        this.list = this._sortingService.keySortByAlphabetical(this.list, key);
        localStorage.setItem('sortProjectsBy', key);
    }

    deactivateProject(id: string) {
        const uuid = this._projectService.iriToUuid(id);
        // the deleteProject() method in js-lib sets the project's status to false, it is not actually deleted

        this._dspApiConnection.admin.projectsEndpoint
            .deleteProject(id)
            .pipe(
                tap((response: ApiResponseData<ProjectResponse>) => {
                    this._applicationStateService.set(uuid, response.body.project);
                    this.refreshParent.emit();
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            )
        );
    }

    activateProject(id: string) {
        // As there is no activate route implemented in the js lib, we use the update route to set the status to true
        const data: UpdateProjectRequest = new UpdateProjectRequest();
        data.status = true;

        const uuid = this._projectService.iriToUuid(id);

        this._dspApiConnection.admin.projectsEndpoint
            .updateProject(id, data)
            .pipe(
                tap((response: ApiResponseData<ProjectResponse>) => {
                    this._applicationStateService.set(uuid, response.body.project);
                    this.refreshParent.emit();

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            )
        );
    }
}
