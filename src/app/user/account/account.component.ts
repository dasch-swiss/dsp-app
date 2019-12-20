import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, LogoutResponse, ReadUser, UserResponse } from '@knora/api';
import { KnoraApiConnectionToken, SessionService } from '@knora/core';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

    loading: boolean;

    @Input() username: string;

    user: ReadUser;

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your account');
    }

    ngOnInit() {
        this.loading = true;

        // set the cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));

        // get from cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(response => {
            if (response === true) {
                // get the mode
                switch (mode) {
                    case 'deleteUser':
                        this.deleteUser(id);
                        break;

                    case 'activateUser':
                        this.activateUser(id);
                        break;
                }
            } else {
                // update the view
                this.refreshParent.emit();
            }
        });
    }

    deleteUser(id: string) {
        this.knoraApiConnection.admin.usersEndpoint.deleteUser(id).subscribe(
            (response: ApiResponseData<UserResponse>) => {

                // console.log('refresh parent after delete', response);
                // this action will deactivate own user account. The consequence is a logout
                this.knoraApiConnection.v2.auth.logout().subscribe(
                    (logoutResponse: ApiResponseData<LogoutResponse>) => {

                        // destroy cache
                        this._cache.destroy();

                        // destroy (knora-ui) session
                        this._session.destroySession();

                        // reload the page
                        window.location.reload();
                    },
                    (error: ApiResponseError) => {
                        console.error(error);
                    }
                );
            },
            (error: ApiResponseError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );

    }

    activateUser(id: string) {

        this.knoraApiConnection.admin.usersEndpoint.updateUserStatus(id, true).subscribe(
            (response: ApiResponseData<UserResponse>) => {

                // console.log('refresh parent after activate', response);
                this.refreshParent.emit();
            },
            (error: ApiResponseError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }
}
