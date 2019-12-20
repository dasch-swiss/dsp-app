import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ReadProject, ListNode, StringLiteral, ListsResponse, ListNodeInfo } from '@knora/api';
import { KnoraApiConnectionToken, Session } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;

    reload: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    // lists in the project
    projectLists: ListNodeInfo[] = [];

    // list of languages
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    // current selected language
    language: string;

    openPanel: number;

    // i18n plural mapping
    itemPluralMapping = {
        title: {
            '=1': '1 List',
            other: '# Lists'
        }
    };

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _dialog: MatDialog,
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Lists');
    }

    ngOnInit() {

        this.loading = true;

        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                this.initList();

                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
                this.loading = false;
            }
        );
    }

    /**
     * build the list of lists
     */
    initList(): void {
        this.knoraApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this.projectLists = response.body.lists;

                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );
    }

    refresh(): void {
        // referesh the component
        this.loading = true;

        this.initList();
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
            this.refresh();
        });
    }

}
