import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    DeleteListResponse,
    KnoraApiConnection,
    List,
    ListNodeInfo,
    ListsResponse,
    ProjectResponse,
    ReadProject,
    StringLiteral,
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from 'src/app/app-global';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { Session, SessionService } from 'src/app/main/services/session.service';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

    // loading for progress indicator
    loading: boolean;
    loadList: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;
    projectMember = undefined;

    // project uuid; as identifier in project cache service
    projectUuid: string;

    // project data
    project: ReadProject;

    // lists in the project
    lists: ListNodeInfo[] = [];

    // list of languages
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    // current selected language
    language: string;

    // selected list
    list: ListNodeInfo;

    // selected list iri
    listIri: string = undefined;

    openPanel: number;

    // i18n plural mapping
    itemPluralMapping = {
        list: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': '1 list',
            other: '# lists'
        }
    };

    // disable content on small devices
    disableContent = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _ais: AppInitService,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _fb: UntypedFormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _titleService: Title,
        private _projectService: ProjectService) {

        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });

    }

    @HostListener('window:resize', ['$event']) onWindowResize(e: Event) {
        this.disableContent = (window.innerWidth <= 768);
        // reset the page title
        if (!this.disableContent) {
            this._setPageTitle();
        }
    }

    ngOnInit() {

        this.disableContent = (window.innerWidth <= 768);

        this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session ? this.session.user.sysAdmin : false;

        // get the project
        this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(this._projectService.uuidToIri(this.projectUuid)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // set the page title
                this._setPageTitle();

                // is logged-in user projectAdmin?
                if(this.session){
                    this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);
                }

                // get list iri from list name
                this._route.params.subscribe(params => {
                    this.listIri = `${this._ais.dspAppConfig.iriBase}/lists/${this.project.shortcode}/${params['list']}`;
                    this.initLists();
                });

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    /**
     * build the list of lists
     */
    initLists(): void {

        this.loading = true;

        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this.lists = response.body.lists;

                if (this.listIri) {
                    this.list = this.lists.find(i => i.id === this.listIri);
                }

                this.loading = false;

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    /**
    * open dialog in every case of modification:
    * edit list data, remove list from project etc.
    *
    */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, id: iri, project: this.project.id }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe((data) => {
            switch (mode) {
                case 'editListInfo': {
                    window.location.reload();
                    break;
                }
                case 'deleteList': {
                    if (typeof(data) === 'boolean' && data === true) {
                        this._dspApiConnection.admin.listsEndpoint.deleteListNode(this.listIri).subscribe(
                            (res: ApiResponseData<DeleteListResponse>) => {
                                this.lists = this.lists.filter(list => list.id !== res.body.iri);

                                this._router.navigateByUrl(`/project/${this.projectUuid}/data-models`).then(() => {
                                    // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                                    window.location.reload();
                                });
                            },
                            (error: ApiResponseError) => {
                                // if DSP-API returns a 400, it is likely that the list node is in use so we inform the user of this
                                if (error.status === 400) {
                                    const errorDialogConfig: MatDialogConfig = {
                                        width: '640px',
                                        position: {
                                            top: '112px'
                                        },
                                        data: { mode: 'deleteListNodeError' }
                                    };

                                    // open the dialog box
                                    this._dialog.open(DialogComponent, errorDialogConfig);
                                } else {
                                    // use default error behavior
                                    this._errorHandler.showMessage(error);
                                }
                            }
                        );
                    }
                    break;
                }
            }
        });
    }

    private _setPageTitle() {
        this._titleService.setTitle('Project ' + this.project?.shortname + ' | List' + (this.listIri? '' : 's'));
    }

}
