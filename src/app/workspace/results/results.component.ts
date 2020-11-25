import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchParams } from '@dasch-swiss/dsp-ui';
import { ReadProject } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

    searchParams: SearchParams;

    resIri: string;

    resourceIri: string;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router
    ) {

        this._route.paramMap.subscribe((params: Params) => {
            this.searchParams = {
                query: decodeURIComponent(params.get('q')),
                mode: (decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch')
            };
            // get the project iri if exists
            if (params.get('project')) {
                this.searchParams.filter = {
                    limitToProject: decodeURIComponent(params.get('project'))
                };
            }

        });
    }

    ngOnInit() {
    }

    openResource(id: string) {
        this.resourceIri = id;
    }

    // open project in new tab
    openProject(project: ReadProject){
        window.open('/project/' + project.shortcode, "_blank");
    }
}
