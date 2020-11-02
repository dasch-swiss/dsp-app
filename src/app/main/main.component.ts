import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiResponseData, ApiResponseError, Constants, KnoraApiConnection, ProjectsResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, SessionService } from '@dasch-swiss/dsp-ui';
import { GridItem } from './grid/grid.component';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

    loading: boolean;
    errorMessage: ApiResponseError;

    showCookieBanner: boolean = true;

    researchField: string = 'qualitative';

    session: boolean = false;

    disabledProjects: string[] = [
        Constants.SystemProjectIRI,
        Constants.DefaultSharedOntologyIRI,
        'http://rdfh.ch/projects/0001'
    ];

    projects: GridItem[] = [];

    features: GridItem[] = [
        {
            icon: 'all_inclusive',
            title: 'Longevity of Humanities Data',
            text: 'DSP-API keeps data accessible, citable, and reusable, even as technologies change.'
        },
        {
            icon: 'search',
            title: 'Powerful Searches',
            text: 'Search for relationships between text, metadata, annotations, markup, links, and more.'
        },
        {
            icon: 'share',
            title: 'Ensures Consistency',
            text: 'You define your data model, and DSP-API ensures that your data is consistent with it.'
        },
        {
            icon: 'history',
            title: 'History',
            text: 'When data changes, DSP-API preserves past versions, so you can still view and cite them.'
        },
        {
            icon: 'lock',
            title: 'Control Access',
            text: 'You decide who can view and change each item of data in your project.'
        },
        {
            icon: 'group',
            title: 'Project members',
            text: 'Form your team and let the knowledge grow out of your data and resources.'
        }
    ];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _session: SessionService,
        private _router: Router,
        private _titleService: Title
    ) {
        // set the page title
        this._titleService.setTitle('DaSCH Service Platform');


        // check if a session is active
        if (this._session.getSession()) {
            this._router.navigate(['dashboard']);
        }
    }

    ngOnInit() {
        if (sessionStorage.getItem('cookieBanner') === null) {
            sessionStorage.setItem('cookieBanner', JSON.stringify(this.showCookieBanner));
        } else {
            this.showCookieBanner = JSON.parse(sessionStorage.getItem('cookieBanner'));
        }
        this.loadProjects();
    }

    loadProjects() {
        this.loading = true;
        this._dspApiConnection.admin.projectsEndpoint.getProjects().subscribe(
            (response: ApiResponseData<ProjectsResponse>) => {
                const sliceLength: number = 160;

                for (const project of response.body.projects) {
                    // disable default test projects

                    if (!this.disabledProjects.includes(project.id) && project.status) {
                        const projectItem: GridItem = <GridItem>{};
                        projectItem.title = project.longname;

                        const preview: string = project.description[0].value.replace(/(<([^>]+)>)/ig, '');

                        projectItem.text = preview.substring(0, sliceLength).trim() +
                            (preview.length > sliceLength ? '...' : '');

                        projectItem.url = 'project/' + project.shortcode;

                        this.projects.push(projectItem);
                    }
                }

                this.projects.sort((a, b) => (a.title > b.title) ? 1 : -1);

                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
                this.errorMessage = error;
                this.loading = false;
            }
        );
    }

    closeCookieBanner() {
        this.showCookieBanner = !this.showCookieBanner;
        sessionStorage.setItem('cookieBanner', JSON.stringify(this.showCookieBanner));
    }
}
