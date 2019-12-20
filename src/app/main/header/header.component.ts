import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { SessionService } from '@knora/core';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    session: boolean = false;
    show: boolean = false;

    constructor(
        private _session: SessionService,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry,
        private _router: Router) {

        // create tool icons to use them in mat-icons
        // knora-app icon with text
        this._matIconRegistry.addSvgIcon(
            'knora_app_banner',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/knora-app-banner.svg')
        );
        // knora-app icon (for smaller screens)
        this._matIconRegistry.addSvgIcon(
            'knora_app_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/knora-app-icon.svg')
        );

        // logged-in user? show user menu or login button

        this._router.events.forEach((event) => {
            if (event instanceof NavigationStart) {
                this.session = this._session.validateSession();
            }
        });
    }

    /**
     * Navigate to the login page
     */
    goToLogin() {
        // console.log(decodeURI(this._router.url));
        this._router.navigate(['login'], {
            queryParams: {
                returnUrl: decodeURI(this._router.url)
            }
        });
    }

    /**
     * Show or hide search bar in phone version
     */
    showSearchBar() {
        this.show = !this.show;
    }

}
