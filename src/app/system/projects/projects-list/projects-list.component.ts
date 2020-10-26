import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApiResponseData, ApiResponseError, Constants, KnoraApiConnection, ProjectResponse, ReadUser, UpdateProjectRequest, StoredProject } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SortingService, SessionService } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from '../../../main/dialog/dialog.component';

@Component({
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // list of default, dsp-specific projects, which are not able to be deleted or to be editied
    doNotDelete: string[] = [
        Constants.SystemProjectIRI,
        Constants.DefaultSharedOntologyIRI
    ];

    // list of users: status active or inactive (deleted)
    @Input() status: boolean;

    // list of projects: depending on the parent
    @Input() list: StoredProject[];

    // enable the button to create new project
    @Input() createNew: boolean = false;

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // i18n plural mapping
    itemPluralMapping = {
        project: {
            '=1': '1 Project',
            other: '# Projects'
        }
    };

    // sort properties
    sortProps: any = [
        {
            key: 'shortcode',
            label: 'Short code'
        },
        {
            key: 'shortname',
            label: 'Short name'
        },
        {
            key: 'longname',
            label: 'Project name'
        }
    ];

    // ... and sort by 'longname'
    sortBy: string = 'longname';

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _session: SessionService,
        private _sortingService: SortingService,
        private _dialog: MatDialog,
        private _router: Router) { }

    ngOnInit() {
        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // sort list by defined key
        if (localStorage.getItem('sortProjectsBy')) {
            this.sortBy = localStorage.getItem('sortProjectsBy');
        } else {
            localStorage.setItem('sortProjectsBy', this.sortBy);
        }

        if (this.list) {
            this.sortList(this.sortBy);
        }
    }

    /**
     * returns true, when the user is project admin;
     * when the parameter permissions is not set,
     * it returns the value for the logged-in user
     *
     *
     * @param  id project iri
     * @returns boolean
     */
    userIsProjectAdmin(id: string): boolean {
        // check if the logged-in user is project admin
        return this.session.user.projectAdmin.some(e => e === id);
    }

    /**
     * Navigate to the project pages (e.g. board, collaboration or ontology)
     *
     * @param code
     * @param page
     */
    openProjectPage(code: string, page: 'collaboration' | 'ontologies' | 'lists') {
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => {
                if (page) {
                    this._router.navigate(['/project/' + code + '/' + page]);
                } else {
                    this._router.navigate(['/project/' + code]); // project board
                }}
        );
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode, project: id }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            if (response === true) {
                // get the mode
                switch (mode) {
                    case 'deleteProject':
                        this.deleteProject(id);
                        break;

                    case 'activateProject':
                        this.activateProject(id);
                        break;
                }
            } else {
                // update the view
                this.refreshParent.emit();
            }
        });
    }

    sortList(key: any) {
        this.list = this._sortingService.keySortByAlphabetical(this.list, key);
        localStorage.setItem('sortProjectsBy', key);
    }

    deleteProject(id: string) {
        this._dspApiConnection.admin.projectsEndpoint.deleteProject(id).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.refreshParent.emit();
                // update project cache
                this._cache.del(response.body.project.shortcode);
                this._cache.get(response.body.project.shortcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(response.body.project.shortcode));
            },
            (error: ApiResponseError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }

    activateProject(id: string) {
        // hack because of issue #100 in dsp-js
        const data: UpdateProjectRequest = new UpdateProjectRequest();
        data.status = true;

        this._dspApiConnection.admin.projectsEndpoint.updateProject(id, data).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.refreshParent.emit();
                // update project cache
                this._cache.del(response.body.project.shortcode);
                this._cache.get(response.body.project.shortcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(response.body.project.shortcode));
            },
            (error: ApiResponseError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }
}
