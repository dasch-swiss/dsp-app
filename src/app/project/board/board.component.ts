import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Dataset,
    KnoraApiConnection,
    ProjectResponse,
    ProjectsMetadata,
    ReadProject,
    SingleProject
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { CacheService } from '../../main/cache/cache.service';

export interface DatasetRadioOption {
    name: string;
    id: number;
    checked: boolean;
}

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss']
})

export class BoardComponent implements OnInit {

    // loading for progress indicator
    loading: boolean;
    metadataLoading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    color: string = 'primary';

    // variables to store metadata information
    // metadata received from backend
    metadata: object;

    projectsMetadata: ProjectsMetadata;
    datasetList: Dataset[] = [];
    singleProjectList: SingleProject[] = [];
    subProperties = {};
    selectedDataset: Dataset;
    selectedProject: SingleProject;

    // list of dataset names to display as radio buttons in right side column
    datasetOptions: DatasetRadioOption[];

    // different metadata download formats
    metadataDownloadFormats = ['JSON-LD', 'XML', 'Triplestore', 'CSV'];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _titleService: Title,
        private _snackBar: MatSnackBar
    ) {
        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode);
    }

    ngOnInit() {
        this.loading = true;
        this.metadataLoading = true;

        // get information about the logged-in user, if one is logged-in
        if (this._session.getSession()) {
            this.session = this._session.getSession();
            // is the logged-in user system admin?
            this.sysAdmin = this.session.user.sysAdmin;

        }

        // get project info from backend
        this.getProject();
    }

    getProject() {
        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // get project and dataset metadata from backend
                this.getProjectMetadata();

                // is logged-in user projectAdmin?
                if (this._session.getSession()) {
                    this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.loading = false;
    }

    getProjectMetadata() {
        // get project metadata from backend
        this.projectcode, this._dspApiConnection.v2.metadata.getProjectMetadata(this.project.id).subscribe(
            (response: ProjectsMetadata) => {
                this.projectsMetadata = response;
                this.metadataLoading = false;

                // create list according to it's type
                this.projectsMetadata.projectsMetadata.forEach((obj) => {
                    if (obj instanceof Dataset) {
                        this.datasetList.push(obj);
                    }
                    else if (obj instanceof SingleProject) {
                        this.singleProjectList.push(obj);
                    }
                    else {
                        this.subProperties[obj.id] = obj;
                    }
                });

                const dsOptions = [];
                // dataset options to display radio buttons for selection in right column
                for (let idx = 0; idx < this.datasetList.length; idx++) {
                    dsOptions.push({
                        name: this.datasetList[idx].title,
                        id: idx,
                        checked: idx === 0 ? true : false
                    });
                }

                this.datasetOptions = dsOptions;

                // by default display first dataset
                this.selectedDataset = this.datasetList[0];

                // get project 
                this.getProjectForDataset();
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.metadataLoading = false;
    }

    getProjectForDataset() {
        // get selected project for this dataset
        // note that dataset always contains only one SingleProject
        for (let proj of this.singleProjectList) {
            if (this.selectedDataset.project.id === proj.id) {
                this.selectedProject = proj;
                break;
            }
        };
    }

    getSubProperty(id: string) {
        return this.subProperties[id];
    }

    // download metadata
    downloadMetadata() {
        const blob: Blob = new Blob([JSON.stringify(this.metadata)], {type: 'application/json'});
        const fileName: string = 'metadata.json';
        const objectUrl: string = URL.createObjectURL(blob);
        const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;

        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    }

    updateDataset(event: MatRadioChange) {
        this.selectedDataset = this.datasetList[event.value];
        this.getProjectForDataset();
    }

    // copy link to clipboard
    copyToClipboard(msg: string) {
        const message = 'Copied to clipboard!';
        const action = msg;
        this._snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: {mode: mode, title: name, project: id}
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            // update the view
            this.getProject();
        });
    }
}
