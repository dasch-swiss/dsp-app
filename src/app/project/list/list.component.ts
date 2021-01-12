import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ListNodeInfo,
    ListsResponse,
    ProjectResponse,
    ReadProject,
    StringLiteral
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;
    loadList: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

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

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
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
            this.projectcode = params.get('shortcode');
        });

        // get list iri from route
        if (this._route.snapshot && this._route.snapshot.params.id) {
            this.listIri = decodeURIComponent(this._route.snapshot.params.id);
        }

        // set the page title
        if (this.listIri) {
            this._titleService.setTitle('Project ' + this.projectcode + ' | List');
        } else {
            this._titleService.setTitle('Project ' + this.projectcode + ' | Lists');
        }
    }

    ngOnInit() {

        this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

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

        const goto = 'project/' + this.projectcode + '/lists/' + encodeURIComponent(id);
        this._router.navigateByUrl(goto, { skipLocationChange: false });

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
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, id: iri, project: this.project.id }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(() => {
            // update the view
            this.initList();
        });
    }

}
