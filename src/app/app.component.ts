import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from '@knora/authentication';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    session: boolean = false;

    constructor(private _titleService: Title,
                private _auth: AuthenticationService) {

        // set the page title
        this._titleService.setTitle('Knora User Interface | Research Layer');

        this.session = this._auth.session();
    }

    ngOnInit () {
        // get info about the logged-in person;
        // in case of guest user show landing page without full header

    }

}
