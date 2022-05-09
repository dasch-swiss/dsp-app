import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    ApiResponseError,
    ReadProject
} from '@dasch-swiss/dsp-js';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { Session, SessionService } from 'src/app/main/services/session.service';
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

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    // project shortcode; as identifier in project cache service
    projectCode: string;

    // project data
    project: ReadProject;

    color = 'primary';

    constructor(
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
            this.projectCode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectCode);
    }

    ngOnInit() {
        this.loading = true;

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
        // get the project data from cache
        this._cache.get(this.projectCode).subscribe(
            (response: ReadProject) => {
                this.project = response;

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
            data: { mode: mode, title: name, project: id }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            // update the view
            this.getProject();
        });
    }
}
