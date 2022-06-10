import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppInitService } from 'src/app/app-init.service';
import { OntologyService } from 'src/app/project/ontology/ontology.service';
import { FilteredResources, SearchParams } from 'src/app/workspace/results/list-view/list-view.component';
import { SplitSize } from 'src/app/workspace/results/results.component';

@Component({
    selector: 'app-ontology-class-instance',
    templateUrl: './ontology-class-instance.component.html',
    styleUrls: ['./ontology-class-instance.component.scss']
})
export class OntologyClassInstanceComponent {

    projectId: string;

    classId: string;

    instanceId: string;

    searchParams: SearchParams;

    // which resources are selected?
    selectedResources: FilteredResources;

    // display single resource or intermediate page in case of multiple selection
    viewMode: 'single' | 'intermediate' | 'compare' = 'single';

    splitSizeChanged: SplitSize;

    constructor(
        private _ais: AppInitService,
        private _route: ActivatedRoute,
        private _ontologyService: OntologyService
    ) {

        // parameters from the url
        const projectCode = this._route.parent.snapshot.params.shortcode;

        this.projectId = `${this._ais.dspAppConfig.iriBase}/projects/${projectCode}`;

        this._route.params.subscribe(params => {
            const iriBase = this._ontologyService.getIriBaseUrl();

            const ontologyName = params['onto'];
            const className = params['class'];

            // get the resource class id from route
            this.classId = `${iriBase}/ontology/${projectCode}/${ontologyName}/v2#${className}`;

            this.instanceId = params['instance'];
            if (this.instanceId) {
                // single instance

                if (this.instanceId === 'add') {
                    // create new res class instance: display res instance form
                }
            } else {
                this.searchParams = {
                    query: this._setGravsearch(this.classId),
                    mode: 'gravsearch'
                };
            }
        });
    }

    openSelectedResources(res: FilteredResources) {

        this.selectedResources = res;

        if (!res || res.count <= 1) {
            this.viewMode = 'single';
        } else {
            if (this.viewMode !== 'compare') {
                this.viewMode = ((res && res.count > 0) ? 'intermediate' : 'single');
            }
        }

    }

    private _setGravsearch(iri: string): string {
        return `
        PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
        CONSTRUCT {

        ?mainRes knora-api:isMainResource true .

        } WHERE {

        ?mainRes a knora-api:Resource .

        ?mainRes a <${iri}> .

        }

        OFFSET 0`;
    }

}
