import { Component, Inject, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiResponseData, KnoraApiConnection, ProjectResponse, ReadOntology, ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { OntologyService } from 'src/app/project/ontology/ontology.service';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';
import { FilteredResources, SearchParams } from 'src/app/workspace/results/list-view/list-view.component';
import { SplitSize } from 'src/app/workspace/results/results.component';

@Component({
    selector: 'app-ontology-class-instance',
    templateUrl: './ontology-class-instance.component.html',
    styleUrls: ['./ontology-class-instance.component.scss']
})
export class OntologyClassInstanceComponent implements OnChanges {

    projectIri: string;

    ontoId: string;

    // id (iri) of resource class
    classId: string;

    resClass: ResourceClassDefinition;

    // uuid of resource instance
    instanceId: string;
    // id (iri) or resource instance
    resourceIri: string;

    searchParams: SearchParams;

    // which resources are selected?
    selectedResources: FilteredResources;

    // display single resource or intermediate page in case of multiple selection
    viewMode: 'single' | 'intermediate' | 'compare' = 'single';

    splitSizeChanged: SplitSize;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _ais: AppInitService,
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _ontologyService: OntologyService,
        private _projectService: ProjectService
    ) {

        // parameters from the url
        const uuid = this._route.parent.snapshot.params.uuid;

        this.projectIri = this._projectService.uuidToIri(uuid);

        this._route.params.subscribe(params => {
            this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(this.projectIri).subscribe(
                (res: ApiResponseData<ProjectResponse>) => {
                    const shortcode = res.body.project.shortcode;
                    const iriBase = this._ontologyService.getIriBaseUrl();

                    const ontologyName = params['onto'];
                    const className = params['class'];

                    // get the resource class id from route
                    this.ontoId = `${iriBase}/ontology/${shortcode}/${ontologyName}/v2`;
                    this.classId = `${this.ontoId}#${className}`;

                    this.instanceId = params['instance'];
                    if (this.instanceId) {
                        // single instance view

                        if (this.instanceId === 'add') {
                            // create new res class instance: display res instance form
                            this.ngOnChanges();
                        } else {
                            // get the single resource instance
                            this.resourceIri = `${this._ais.dspAppConfig.iriBase}/${shortcode}/${this.instanceId}`;
                        }
                    } else {
                        // display all resource instances of this resource class
                        this.searchParams = {
                            query: this._setGravsearch(this.classId),
                            mode: 'gravsearch'
                        };
                    }
                });
            });
    }

    ngOnChanges() {
        this._cache.get('currentProjectOntologies').subscribe(
            (ontologies: ReadOntology[]) => {
                // find ontology of current resource class to get the class label
                const classes = ontologies[ontologies.findIndex(onto => onto.id === this.ontoId)].getAllClassDefinitions();
                this.resClass = <ResourceClassDefinition>classes[classes.findIndex(res => res.id === this.classId)];
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
        );
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
