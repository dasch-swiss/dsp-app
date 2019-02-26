import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

    loading: boolean;

    @Input() username: string;

    user: User;

    constructor(private _cache: CacheService,
                private _usersService: UsersService,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your account');
    }

    ngOnInit() {
        this.loading = true;

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

}
