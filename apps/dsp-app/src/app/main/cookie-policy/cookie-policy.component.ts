import { Location } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-cookie-policy',
    templateUrl: './cookie-policy.component.html',
    styleUrls: ['./cookie-policy.component.scss'],
})
export class CookiePolicyComponent {
    constructor(private _location: Location) {}

    goBack() {
        this._location.back();
    }
}
