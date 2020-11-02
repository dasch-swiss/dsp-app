import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiResponseData, ApiResponseError, HealthResponse, KnoraApiConfig, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConfigToken, DspApiConnectionToken, NotificationService } from '@dasch-swiss/dsp-ui';
import { GridItem } from '../grid/grid.component';

declare let require: any;
const { version: appVersion, name: appName } = require('../../../../package.json');

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

    loading = true;

    appVersion: string = appVersion;

    sipiVersion = 'v3.0.0-rc.5';

    apiStatus: HealthResponse;

    docs: GridItem[] = [
        {
            icon: 'assignment',
            title: 'Project management',
            text: 'Read more about project administration, project members and how to define a data model.',
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
            title: 'DSP-APP ',
            text: 'This is the tool of the user interface you are using right now. DaSCH\'s generic web application.',
            url: 'https://github.com/dasch-swiss/dsp-app/releases/tag/v',
            urlText: 'Release notes'
        },
        {
            title: 'DSP-API ',
            text: 'Framework to store, share, and work with primary resources in the humanities.',
            url: 'https://github.com/dasch-swiss/knora-api/releases/tag/',
            urlText: 'Release notes'
        },
        {
            title: 'Sipi ',
            text: 'High-performance, IIIF compatible media storage server.',
            url: 'https://github.com/dasch-swiss/Sipi/releases/tag/',
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
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry) {

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

        // set dsp-app version
        this.tools[0].title += ' v' + this.appVersion;
        this.tools[0].url += this.appVersion;

        // set dsp-sipi version
        this.tools[2].title += this.sipiVersion;
        this.tools[2].url += this.sipiVersion;

        this._dspApiConnection.system.healthEndpoint.getHealthStatus().subscribe(
            (response: ApiResponseData<HealthResponse>) => {
                this.apiStatus = response.body;
                const apiVersion = this.apiStatus.webapiVersion;
                this.tools[1].title += apiVersion;
                this.tools[1].url += apiVersion;
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        )

    }

}
