import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
    MatLegacyDialog as MatDialog,
    MatLegacyDialogConfig as MatDialogConfig,
} from '@angular/material/legacy-dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import {
    ComponentCommunicationEventService,
    Events,
} from '@dsp-app/src/app/main/services/component-communication-event.service';
import { SearchParams } from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { DspConfig } from '../declarations/dsp-config';
import { NotificationService } from '../services/notification.service';
import { SessionService } from '../services/session.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    session = false;
    show = false;
    searchParams: SearchParams;

    dsp: DspConfig;

    componentCommsSubscription: Subscription;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _appInitService: AppInitService,
        private _componentCommsService: ComponentCommunicationEventService,
        private _dialog: MatDialog,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry,
        private _notification: NotificationService,
        private _router: Router,
        private _session: SessionService
    ) {
        // create own logo icon to use them in mat-icons
        this._matIconRegistry.addSvgIcon(
            'dasch_mosaic_icon_color',
            this._domSanitizer.bypassSecurityTrustResourceUrl(
                '/assets/images/dasch-mosaic-icon-color.svg'
            )
        );

        // logged-in user? show user menu or login button
        this._router.events.forEach((event) => {
            if (event instanceof NavigationStart) {
                this._session
                    .isSessionValid()
                    .subscribe((response: boolean) => {
                        this.session = response;
                    });
            }
        });

        this.dsp = this._appInitService.dspConfig;
    }

    ngOnInit() {
        this.componentCommsSubscription = this._componentCommsService.on(
            Events.loginSuccess,
            () => {
                this._notification.openSnackBar('Login successful');
            }
        );
    }

    ngOnDestroy() {
        // unsubscribe from the ValueOperationEventService when component is destroyed
        if (this.componentCommsSubscription !== undefined) {
            this.componentCommsSubscription.unsubscribe();
        }
    }

    /**
     * show or hide search bar in phone version
     */
    showSearchBar() {
        this.show = !this.show;
    }

    doSearch(search: SearchParams) {
        // reset search params
        this.searchParams = undefined;

        // we can do the routing here or send the search param
        // to (resource) list view directly
        this.searchParams = search;

        if (this.searchParams.mode && this.searchParams.query) {
            let doSearchRoute =
                '/search/' +
                this.searchParams.mode +
                '/' +
                encodeURIComponent(this.searchParams.query);

            if (
                this.searchParams.filter &&
                this.searchParams.filter.limitToProject
            ) {
                doSearchRoute +=
                    '/' +
                    encodeURIComponent(this.searchParams.filter.limitToProject);
            }

            this._router.navigate([doSearchRoute]);
        }
    }

    openDialog(mode: string, name?: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '840px',
            maxHeight: '80vh',
            position: {
                top: '112px',
            },
            data: { mode: mode, title: name, id: iri },
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(() => {
            // do something
        });
    }

}
