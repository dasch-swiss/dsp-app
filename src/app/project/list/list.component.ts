import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
    ReadProject,
    StringLiteral,
    UserResponse
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from 'src/app/app-global';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { Session, SessionService } from 'src/app/main/services/session.service';

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

    // project shortcode; as identifier in project cache service
    projectCode: string;

    // project data
    project: ReadProject;

    // lists in the project
    lists: ListNodeInfo[] = [];

    // list of languages
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    // current selected language
    language: string;

    // form to select list
    listForm: FormGroup;

    // selected list
    list: ListNodeInfo;
    // selected list iri
    listIri: string = undefined;

    openPanel: number;

    // i18n plural mapping
    itemPluralMapping = {
        list: {
            '=1': '1 list',
            other: '# lists'
        }
    };

    // disable content on small devices
    disableContent = false;

    // feature toggle for new concept
    beta = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _ais: AppInitService,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _fb: FormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectCode = params.get('shortcode');
        });

        // get list iri from route
        if (this._route.snapshot && this._route.snapshot.params.id) {
            this.listIri = decodeURIComponent(this._route.snapshot.params.id);
        }

        // set the page title
        this._setPageTitle();

        // get feature toggle information if url contains beta
        this.beta = (this._route.parent.snapshot.url[0].path === 'beta');
        if (this.beta) {
            // get list iri from list name
            this._route.params.subscribe(params => {
                const id = `${this._ais.dspAppConfig.iriBase}/lists/${this.projectCode}/${params['list']}`;
                this.openList(id);
            });
        }

    }

    @HostListener('window:resize', ['$event']) onWindwoResize(e: Event) {
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
        this.sysAdmin = this.session.user.sysAdmin;

        // get the project data from cache
        this._cache.get(this.projectCode).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                // or at least project member?
                if (!this.projectAdmin) {
                    this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.session.user.name).subscribe(
                        (res: ApiResponseData<UserResponse>) => {
                            const usersProjects = res.body.user.projects;
                            if (usersProjects.length === 0) {
                                // the user is not part of any project
                                this.projectMember = false;
                            } else {
                                // check if the user is member of the current project
                                this.projectMember = usersProjects.some(p => p.shortcode === this.projectCode);
                            }
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        }
                    );
                } else {
                    this.projectMember = this.projectAdmin;
                }

                this.initList();

                this.listForm = this._fb.group({
                    list: new FormControl({
                        value: this.listIri, disabled: false
                    })
                });

                this.listForm.valueChanges
                    .subscribe(data => this.onValueChanged(data));

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
    initList(): void {

        this.loading = true;

        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this.lists = response.body.lists;

                if (this.lists.length === 1) {
                    this.listIri = this.lists[0].id;
                }

                if (this.listIri) {
                    this.openList(this.listIri);
                }

                this.loading = false;

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    // update view after selecting a list from dropdown
    onValueChanged(data?: any) {

        if (!this.listForm) {
            return;
        }

        // go to page with this id
        this.openList(data.list);

    }

    // open list by iri
    openList(id: string) {

        this.listIri = id;

        this.loadList = true;

        this.list = this.lists.find(i => i.id === id);

        if (!this.beta) {
            const goto = 'project/' + this.projectCode + '/lists/' + encodeURIComponent(id);
            this._router.navigateByUrl(goto, { skipLocationChange: false });
        }

        setTimeout(() => {
            this.loadList = false;
        });

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
                case 'createList': {
                    if (data instanceof List) {
                        this.listIri = data.listinfo.id;
                        this.listForm.controls.list.setValue(this.listIri);
                        this.openList(this.listIri);
                        this.initList();
                    }
                    break;
                }
                case 'editListInfo': {
                    if (this.beta) {
                        // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                        window.location.reload();
                    } else {
                        this.initList();
                    }
                    break;
                }
                case 'deleteList': {
                    if (typeof(data) === 'boolean' && data === true) {
                        this._dspApiConnection.admin.listsEndpoint.deleteListNode(this.listIri).subscribe(
                            (res: ApiResponseData<DeleteListResponse>) => {
                                this.lists = this.lists.filter(list => list.id !== res.body.iri);

                                if (this.beta) {
                                    this._router.navigateByUrl(`/beta/project/${this.projectCode}`).then(() => {
                                        // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                                        window.location.reload();
                                    });
                                } else {
                                    // if there are still lists remaining after deleting a list, load the first list among lists
                                    if (this.lists.length) {
                                        this.listIri = this.lists[0].id;
                                        this.listForm.controls.list.setValue(this.listIri);
                                        this.openList(this.listIri);
                                        this.initList();
                                    } else { // else set the list to null to remove it from the UI
                                        this.list = null;
                                        this.listIri = undefined;
                                    }
                                }
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
        if (this.listIri) {
            this._titleService.setTitle('Project ' + this.projectCode + ' | List');
        } else {
            this._titleService.setTitle('Project ' + this.projectCode + ' | Lists');
        }
    }

}
