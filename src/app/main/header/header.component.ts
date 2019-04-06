import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { AuthenticationService } from '@knora/authentication';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    session: boolean;

    constructor(private _auth: AuthenticationService,
                private _domSanitizer: DomSanitizer,
                private _matIconRegistry: MatIconRegistry,
                private _router: Router) {

        // kuirl icon with text
        this._matIconRegistry.addSvgIcon(
            'kuirl_banner',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/kuirl-banner.svg')
        );
        // kuirl icon (for smaller screens
        this._matIconRegistry.addSvgIcon(
            'kuirl_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/kuirl-icon.svg')
        );

        // logged-in user? show user menu or login button
        this._router.events.forEach((event) => {
            if (event instanceof NavigationStart) {
                this.session = this._auth.session();
            }
        });
    }

    ngOnInit() {
    }

    goToLogin() {
        this._router.navigate(['login'], {
            queryParams: {
                returnUrl: this._router.url
            }
        });
    }

}
