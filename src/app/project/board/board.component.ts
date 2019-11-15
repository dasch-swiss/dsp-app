import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ReadProject, ReadUser } from '@knora/api';
import { KnoraApiConnectionToken, Session } from '@knora/core';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    projectMembers: ReadUser[] = [];

    // i18n setup
    itemPluralMapping = {
        member: {
            // '=0': '0 Members',
            '=1': '1 Member',
            other: '# Members'
        },
        ontology: {
            // '=0': '0 Ontologies',
            '=1': '1 Ontology',
            other: '# Ontologies'
        },
        keyword: {
            // '=0': '0 Keywords',
            '=1': '1 Keyword',
            other: '# Keywords'
        }
    };

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _titleService: Title
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

        // get information about the logged-in user, if one is logged-in
        if (localStorage.getItem('session')) {
            this.session = JSON.parse(localStorage.getItem('session'));
            // is the logged-in user system admin?
            this.sysAdmin = this.session.user.sysAdmin;

            // default value for projectAdmin
            this.projectAdmin = this.sysAdmin;
        }
        this.getProject();
    }

    getProject() {
        // set the cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get project data from cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;
                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );

        this.loading = false;
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, project: id }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            // update the view
            this.getProject();
        });
    }
}
