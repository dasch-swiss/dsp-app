import { Component, OnInit } from '@angular/core';
import {
    MatDialog,
    MatDialogConfig,
} from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiResponseError, ReadProject } from '@dasch-swiss/dsp-js';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { Session, SessionService } from '@dsp-app/src/app/main/services/session.service';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';

export interface DatasetRadioOption {
    name: string;
    id: number;
    checked: boolean;
}

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
    // loading for progress indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    // project uuid; as identifier in project cache service
    projectUuid: string;

    // project data
    project: ReadProject;

    color = 'primary';

    beta = false;

    constructor(
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _router: Router,
        private _titleService: Title
    ) {
        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });

        // get feature toggle information if url contains beta
        this.beta = this._route.parent.snapshot.url[0].path === 'beta';
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
        this._cache.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // is logged-in user projectAdmin?
                if (this._session.getSession()) {
                    this.projectAdmin = this.sysAdmin
                        ? this.sysAdmin
                        : this.session.user.projectAdmin.some(
                              (e) => e === this.project.id
                          );
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.loading = false;
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px',
            },
            data: { mode: mode, title: name, project: id },
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(() => {
            // update the view
            this.getProject();
        });
    }

    featureToggle() {
        this._router.navigate([
            this.beta ? 'beta' : '',
            'project',
            this.projectUuid,
        ]);
    }
}
