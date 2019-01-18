import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

    loading: boolean;
    error: boolean;

    @Input() username: string;

    loggedInUser: boolean = false;

    sysAdmin: boolean = false;

    user: User;

    constructor(private _cache: CacheService,
                private _route: ActivatedRoute,
                private _router: Router,
                private _usersService: UsersService,
                private _titleService: Title) {

        // get username from route and set the cache
        if (this._route.snapshot.params.name  && (this._route.snapshot.params.name.length > 3)) {
            this.username = this._route.snapshot.params.name;
            this._cache.get(this.username, this._usersService.getUser(this.username));
            if (localStorage.getItem('session') && !this.loggedInUser) {
                if (this.username === JSON.parse(localStorage.getItem('session')).user.name) {
                    // redirect to logged-in user profile
                    this._router.navigate(['/profile']);
                }
            }
        }
        // in case of route /profile, it's the logged in user's profile
        this.loggedInUser = (this._route.snapshot.routeConfig.path === 'profile');

        // get info about the logged-in user: does he have the right to change user's profile?
        if (localStorage.getItem('session') && !this.loggedInUser) {
            this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;
        }

    }

    ngOnInit() {
        this.loading = true;

        this._cache.get(this.username, this._usersService.getUser(this.username)).subscribe(
            (response: any) => {
                this.user = response;


                // set the page title
                this._titleService.setTitle(this.user.username + ' (' + this.user.givenName + ' ' + this.user.familyName + ')');

                this.loading = false;
            },
            (error: any) => {
                console.error(error);
            }
        );
    }

    editUser() {
        this._router.navigate(['user/' + this.username + '/edit'], {
            queryParams: {
                returnUrl: this._router.url
            }
        });
    }

}
