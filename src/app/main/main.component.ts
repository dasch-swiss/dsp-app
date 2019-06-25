import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthenticationService } from '@knora/authentication';
import { ApiServiceError, KnoraConstants, Project, ProjectsService } from '@knora/core';
import { GridItem } from './grid/grid.component';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

    loading: boolean;
    errorMessage: ApiServiceError;

    showCookieBanner: boolean = true;

    researchField: string = 'qualitative';

    session: boolean = false;

    disabledProjects: string[] = [
        KnoraConstants.SystemProjectIRI,
        KnoraConstants.DefaultSharedOntologyIRI,
        'http://rdfh.ch/projects/0001'
    ];

    projects: GridItem[] = [];

    features: GridItem[] = [
        {
            icon: 'all_inclusive',
            title: 'Longevity of Humanities Data',
            text: 'Knora keeps data accessible, citable, and reusable, even as technologies change.'
        },
        {
            icon: 'search',
            title: 'Powerful Searches',
            text: 'Search for relationships between text, metadata, annotations, markup, links, and more.'
        },
        {
            icon: 'share',
            title: 'Ensures Consistency',
            text: 'You define your data model, and Knora ensures that your data is consistent with it.'
        },
        {
            icon: 'history',
            title: 'History',
            text: 'When data changes, Knora preserves past versions, so you can still view and cite them.'
        },
        {
            icon: 'perm_identity',
            title: 'Control Access',
            text: 'You decide who can view and change each item of data in your project.'
        },
        {
            icon: 'group',
            title: 'Collaboration',
            text: 'Form your team and let the knowledge grow out of your data and sources.'
        }
    ];

    currentYear: Date = new Date();

    constructor (
        private _auth: AuthenticationService,
        private _projectsService: ProjectsService,
        private _router: Router,
        private _titleService: Title
    ) {
        // set the page title
        this._titleService.setTitle('Knora User Interface | Research Layer');

        // check if a session is active and valid
        if (JSON.parse(localStorage.getItem('session'))) {
            // there's an acitve session, but is it still valid?
            this.session = this._auth.session();

            if (this._auth.session()) {
                this._router.navigate(['dashboard']);
            }
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
        this._projectsService.getAllProjects().subscribe(
            (result: Project[]) => {
                const sliceLength: number = 160;

                for (const project of result) {
                    // disable default test projects

                    if (!this.disabledProjects.includes(project.id)) {
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
            (error: ApiServiceError) => {
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
