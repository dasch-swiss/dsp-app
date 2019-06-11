import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, User } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { Session } from '@knora/authentication';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

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
    project: Project;

    projectMembers: User[] = [];

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

    constructor (
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _projectsService: ProjectsService,
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
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));

        // get project data from cache
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
            (result: any) => {
                this.project = result;
                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        /*
        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode)).subscribe(
            (result: User[]) => {
                this.projectMembers = result;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
        */

        this.loading = false;
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

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.getProject();
        });
    }
}
