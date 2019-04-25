import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { User, UsersService, ApiServiceError } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

    loading: boolean;

    @Input() username: string;

    user: User;

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    constructor(private _cache: CacheService,
                private _dialog: MatDialog,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your account');
    }

    ngOnInit() {
        this.loading = true;

        // set the cache
        this._cache.get(this.username, this._usersService.getUserByUsername(this.username));

        this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
            (response: any) => {
                this.user = response;
                this.loading = false;
            },
            (error: any) => {
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

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
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
        this._usersService.deleteUser(id).subscribe(
            (result: User) => {
                // console.log('refresh parent after delete', result);
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );

    }

    activateUser(id: string) {
        this._usersService.activateUser(id).subscribe(
            (result: User) => {
                // console.log('refresh parent after activate', result);
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }
}
