import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    session: boolean = false;

    constructor(
        private _titleService: Title) {

        // set the page title
        this._titleService.setTitle('DSP-APP | DaSCH\'s generic user interface');

    }

    ngOnInit() {

    }
}
