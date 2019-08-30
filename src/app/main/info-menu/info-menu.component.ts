import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { MenuItem } from '../declarations/menu-item';

declare let require: any;
const { version: appVersion } = require('../../../../package.json');

@Component({
    selector: 'app-info-menu',
    templateUrl: './info-menu.component.html',
    styleUrls: ['./info-menu.component.scss']
})
export class InfoMenuComponent implements OnInit {

    loading: boolean = true;

    appVersion: string = appVersion;
    apiVersion: string;
    akkaVersion: string;

    apiStatus: boolean;

    versions: MenuItem[] = [
        {
            label: '',
            icon: 'kuirl_icon',
            route: 'https://github.com/dhlab-basel/Kuirl/releases/tag/v' + this.appVersion
        },
        {
            label: 'Knora v',
            icon: 'knora_icon',
            route: 'https://github.com/dhlab-basel/Knora/releases/tag/v'
        }
    ];

    constructor (
        @Inject(KuiCoreConfigToken) public config: KuiCoreConfig,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry,
        private _http: HttpClient, ) {

        // create tool icons to use them in mat-icons
        this._matIconRegistry.addSvgIcon(
            'kuirl_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/kuirl-icon.svg')
        );
        this._matIconRegistry.addSvgIcon(
            'knora_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/knora-icon.svg')
        );
        /*
        this._matIconRegistry.addSvgIcon(
          'akka_icon',
          this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/akka-icon.svg')
        );
        */
    }

    ngOnInit() {

        this.versions[0].label = this.config.name + ' v' + this.appVersion;

        this._http.get<HttpResponse<any>>(this.config.api + '/admin/projects', { observe: 'response' })
            .subscribe(
                (resp: HttpResponse<any>) => {
                    // console.log('Stackoverflow', resp.headers.get('Server'));
                    this.readVersion(resp.headers.get('Server'));
                    this.apiStatus = true;
                },
                (error: any) => {
                    this.readVersion(error.headers.get('Server'));
                    console.error(error);
                    // console.log('Stackoverflow', error.headers.get('Server'));
                    this.apiStatus = false;
                }
            );

    }

    readVersion(v: string) {

        if (!v) {
            return;
        }

        const versions: string[] = v.split(' ');

        this.apiVersion = versions[0].split('/')[1].substring(0, 5);
        this.akkaVersion = versions[1].split('/')[1];

        this.versions[1].label += this.apiVersion;
        this.versions[1].route += this.apiVersion;
        // this.versions[2].label += this.akkaVersion;
        // this.versions[2].route += this.akkaVersion;

        this.loading = false;

    }
}
