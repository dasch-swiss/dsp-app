import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthenticationService } from '@knora/authentication';
import { GridItem } from './grid/grid.component';
import { ProjectsService, Project, ApiServiceError } from '@knora/core';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

    loading: boolean;
    errorMessage: ApiServiceError;

    session: boolean = false;

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

    constructor(
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

    ngOnInit( ) {
        this.loadProjects();
    }

    loadProjects() {
        this.loading = true;
        this._projectsService.getAllProjects().subscribe(
            (result: Project[]) => {
                const sliceLength: number = 160;

                for (const project of result) {
                    const projectItem: GridItem = <GridItem>{};
                    projectItem.title = project.longname;

                    const preview: string = project.description[0].value.replace(/(<([^>]+)>)/ig, '');

                    projectItem.text = preview.substring(0, sliceLength).trim() +
                    (preview.length > sliceLength ? '...' : '');

                    this.projects.push(projectItem);
                }

                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
                this.errorMessage = error;
                this.loading = false;
            }
        )
    }
}
