import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-cookie-policy',
    templateUrl: './cookie-policy.component.html',
    styleUrls: ['./cookie-policy.component.scss'],
})
export class CookiePolicyComponent implements OnInit {
    constructor(private _location: Location) {}

    ngOnInit() {}

    goBack() {
        this._location.back();
    }
}
