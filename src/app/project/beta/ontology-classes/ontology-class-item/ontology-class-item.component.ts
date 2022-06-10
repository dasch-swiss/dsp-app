import { Component, Inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassDefinition, KnoraApiConnection, CountQueryResponse, ApiResponseError } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { OntologyService } from 'src/app/project/ontology/ontology.service';

@Component({
    selector: 'app-ontology-class-item',
    templateUrl: './ontology-class-item.component.html',
    styleUrls: ['./ontology-class-item.component.scss']
})
export class OntologyClassItemComponent implements OnInit {

    @Input() resClass: ClassDefinition;

    gravsearch: string;

    results: number;

    link: string;

    // i18n setup
    itemPluralMapping = {
        instance: {
            '=1': '1 instance',
            other: '# instances'
        }
    };

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _ontologyService: OntologyService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {

    }

    ngOnInit(): void {

        const projectCode = this._route.snapshot.params.shortcode;
        const splitIri = this.resClass.id.split('#');
        const ontologyName = this._ontologyService.getOntologyName(splitIri[0]);
        this.link = `/beta/project/${projectCode}/ontology/${ontologyName}/${splitIri[1]}`;

        this.gravsearch = this._setGravsearch(this.resClass.id);

        // get number of resource instances
        this._dspApiConnection.v2.search.doExtendedSearchCountQuery(this.gravsearch).subscribe(
            (res: CountQueryResponse) => {
                this.results = res.numberOfResults;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    open(route: string) {
        this._router.navigateByUrl(route);
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
