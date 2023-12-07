import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {Router} from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ProjectResponse,
    ReadProject,
    ReadUser,
    StoredProject,
    UpdateProjectRequest,
} from '@dasch-swiss/dsp-js';
import {DspApiConnectionToken, RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {SortProp} from "@dsp-app/src/app/main/action/sort-button/sort-button.component";
import {Observable, Subject, combineLatest} from "rxjs";
import {map, take, takeUntil, tap} from "rxjs/operators";
import { Select } from '@ngxs/store';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

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

    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
    @Select(ProjectsSelectors.readProjects) readProjects$: Observable<ReadProject[]>;
    @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _dialog: MatDialog,
        private _router: Router,
        private _sortingService: SortingService,
        private _projectService: ProjectService
    ) {}

    ngOnInit() {
        // sort list by defined key
        this.sortBy = localStorage.getItem('sortProjectsBy') || this.sortBy;
        this.sortList(this.sortBy);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * return true, when the user is entitled to edit a project. This is
     * the case when a user either system admin or project admin of the given project.
     *
     * @param  projectId the iri of the project to be checked
     */
    userHasPermission$(projectId: string): Observable<boolean> {
        return combineLatest([this.user$, this.userProjectAdminGroups$])
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(([user, userProjectGroups]) => {
                    return this._projectService.isProjectAdminOrSysAdmin(user, userProjectGroups, projectId);
                })
            )
    }
    
    /**
     * return true, when the user is project admin of the given project.
     *
     * @param  projectId the iri of the project to be checked
     */
    userIsProjectAdmin$(projectId: string): Observable<boolean> {
        return combineLatest([this.user$, this.userProjectAdminGroups$])
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(([user, userProjectGroups]) => {
                    return this._projectService.isInProjectGroup(userProjectGroups, projectId);
                })
            )
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
        // the deleteProject() method in js-lib sets the project's status to false, it is not actually deleted
        this._dspApiConnection.admin.projectsEndpoint.deleteProject(id)
            .pipe(take(1))
            .subscribe(response => {
                this.refreshParent.emit(); //TODO Soft or Hard refresh ?
            });
    }

    activateProject(id: string) {
        // As there is no activate route implemented in the js lib, we use the update route to set the status to true
        const data: UpdateProjectRequest = new UpdateProjectRequest();
        data.status = true;

        this._dspApiConnection.admin.projectsEndpoint
            .updateProject(id, data)
            .pipe(take(1))
            .subscribe(response => {
                this.refreshParent.emit(); //TODO Soft or Hard refresh ?
            });
    }
}
