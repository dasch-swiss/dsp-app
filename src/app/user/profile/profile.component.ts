import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { Title } from '@angular/platform-browser';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ReadUser,
    UserResponse
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { SessionService } from 'src/app/main/services/session.service';
import { CacheService } from '../../main/cache/cache.service';
import { DialogComponent } from '../../main/dialog/dialog.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

    @Input() username: string;

    @Input() loggedInUser?: boolean = false;

    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    loading: boolean;
    error: boolean;

    sysAdmin = false;

    user: ReadUser;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _titleService: Title
    ) {

        // get info about the logged-in user: does he have the right to change user's profile?
        if (this._session.getSession() && !this.loggedInUser) {
            this.sysAdmin = this._session.getSession().user.sysAdmin;
        }

    }

    ngOnInit() {
        this.getUser();
    }

    getUser() {
        this.loading = true;

        // set the cache
        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));

        // get from cache
        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {

                this.user = response.body.user;

                // set the page title
                this._titleService.setTitle(this.user.username + ' (' + this.user.givenName + ' ' + this.user.familyName + ')');

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    openDialog(mode: string, name: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            // update the view
            this.getUser();
        });
    }

}
