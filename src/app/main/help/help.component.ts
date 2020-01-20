import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { KnoraApiConfig } from '@knora/api';
import { KnoraApiConfigToken, KuiConfig, KuiConfigToken } from '@knora/core';
import { GridItem } from '../grid/grid.component';

declare let require: any;
const { version: appVersion, name: appName } = require('../../../../package.json');

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

    loading: boolean = true;

    appVersion: string = appVersion;

    apiVersion: string;

    apiStatus: boolean;

    docs: GridItem[] = [
        {
            icon: 'assignment',
            title: 'Project management',
            text: 'Read more about project administration, collaboration and how to define a data model.',
            url: 'https://docs.dasch.swiss/user-guide/project',
            urlText: 'Open Documentation'
        },
        {
            icon: 'edit',
            title: 'Research tools',
            text: 'NOT FULLY IMPLEMENTED - Get more information about data handling, search methods and how to use the research tools.',
            url: 'https://docs.dasch.swiss/user-guide/data',
            urlText: 'Open Documentation'
        },
        {
            icon: 'web',
            title: 'Publication',
            text: 'NOT YET IMPLEMENTED',
            url: 'https://docs.dasch.swiss/user-guide/publication',
            urlText: 'Open Documentation'
        }
    ];

    tools: GridItem[] = [
        {
            title: 'Knora app ',
            text: 'This is the tool of the user interface you are using right now. DaSCH\'s generic web application.',
            url: 'https://github.com/dasch-swiss/knora-app/releases/tag/v',
            urlText: 'Release notes'
        },
        {
            title: 'Knora v',
            text: 'Framework to store, share, and work with primary sources in the humanities.',
            url: 'https://github.com/dasch-swiss/Knora/releases/tag/v',
            urlText: 'Release notes'
        },
        {
            title: 'Sipi v2.0.0',
            text: 'High-performance, IIIF compatible media storage server.',
            url: 'https://github.com/dasch-swiss/Sipi/releases/tag/v2.0.0',
            urlText: 'Release notes'
        }
    ];

    support: GridItem[] = [
        {
            title: 'Need more help?',
            text: 'Have you had some issues by using our software? Let us know and get in contact with developers and users:',
            url: 'https://discuss.dasch.swiss',
            urlText: 'DaSCH Forum'
        },
        {
            title: 'DaSCH Infrastructure',
            text: 'Wondering what the Data and Service Center for the Humanities DaSCH exactly is? Get more information on our Website:',
            url: 'https://dasch.swiss',
            urlText: 'dasch.swiss'
        },
        {
            title: 'Contribute',
            text: 'All our software code is open source and accessible on Github. If you want to improve the tools, feel free to contact us on:',
            url: 'https://github.com/dasch-swiss',
            urlText: 'Github'
        }
    ];

    constructor(
        @Inject(KuiConfigToken) private kuiConfig: KuiConfig,
        @Inject(KnoraApiConfigToken) private knoraApiConfig: KnoraApiConfig,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry,
        private _http: HttpClient) {

        // create tool icons to use them in mat-icons
        this._matIconRegistry.addSvgIcon(
            'knora_app_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/knora-app-icon.svg')
        );
        this._matIconRegistry.addSvgIcon(
            'knora_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/knora-icon.svg')
        );
    }

    ngOnInit() {

        // set knora-app version
        this.tools[0].title = this.kuiConfig.app.name + ' v' + this.appVersion;
        this.tools[0].url += this.appVersion;

        const apiUrl: string = this.knoraApiConfig.apiUrl;

        this._http.get(apiUrl + '/admin/projects', { observe: 'response' })
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

        // read and set version of knora
        const versions: string[] = v.split(' ');
        const knora: string = versions[0].split('/')[1];

        // keep version number as x.y.z format (no extra suffix e.g. -SNAPSHOT)
        this.apiVersion = knora.split('-')[0];

        this.tools[1].title += this.apiVersion;
        this.tools[1].url += this.apiVersion;

        this.loading = false;

    }

}
