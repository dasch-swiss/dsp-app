import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from '@knora/authentication';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

    session: boolean = false;

    constructor(private _auth: AuthenticationService,
                private _router: Router,
                private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Knora User Interface | Research Layer');

        // check if a session is active and valid
        if (JSON.parse(localStorage.getItem('session'))) {
            // there's an acitve session, but is it still valid?
            this.session = this._auth.session();

            if (this._auth.session()) {
                this._router.navigate(['dashboard']);
            }
        }
    }

    ngOnInit() {}

}
