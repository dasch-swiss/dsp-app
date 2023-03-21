import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ClassDefinition,
    KnoraApiConnection,
    CountQueryResponse,
    ApiResponseError,
    Constants,
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import {
    ComponentCommunicationEventService,
    Events,
} from '@dsp-app/src/app/main/services/component-communication-event.service';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { OntologyService } from '@dsp-app/src/app/project/ontology/ontology.service';

@Component({
    selector: 'app-ontology-class-item',
    templateUrl: './ontology-class-item.component.html',
    styleUrls: ['./ontology-class-item.component.scss'],
})

export class OntologyClassItemComponent implements OnInit, OnDestroy {
    @Input() resClass: ClassDefinition;

    @Input() projectMember: boolean;

    readonly MAX_LABEL_CHAR = 25;

    gravsearch: string;

    results: number;

    link: string;

    icon: string;

    componentCommsSubscriptions: Subscription[] = [];

    // i18n setup
    itemPluralMapping = {
        entry: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': '1 Entry',
            other: '# Entries',
        },
    };

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _ontologyService: OntologyService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _componentCommsService: ComponentCommunicationEventService
    ) {}

    ngOnInit(): void {
        const uuid = this._route.snapshot.params.uuid;
        const splitIri = this.resClass.id.split('#');
        const ontologyName = this._ontologyService.getOntologyName(splitIri[0]);
        this.link = `/project/${uuid}/ontology/${ontologyName}/${splitIri[1]}`;

        this.gravsearch = this._setGravsearch(this.resClass.id);

        // get number of resource instances
        this._getSearchCount();

        this.icon = this._getIcon();

        this.componentCommsSubscriptions.push(
            this._componentCommsService.on(Events.resourceDeleted, () => {
                this._getSearchCount();

            }
        ));

        this.componentCommsSubscriptions.push(this._componentCommsService.on(
            Events.resourceCreated, () => {
                this._getSearchCount();
            }
        ));
    }

    ngOnDestroy(): void {
        this.componentCommsSubscriptions.forEach(sub => sub.unsubscribe());
    }

    open(route: string) {
        this._router.navigateByUrl(route);
    }


    trimLabel(fullString: string) {
        return fullString.length > this.MAX_LABEL_CHAR ? `${fullString.slice(0, this.MAX_LABEL_CHAR)}...`: fullString;
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

    /**
     * return the correct mat-icon depending on the subclass of the resource
     *
     * @returns mat-icon name as string
     */
    private _getIcon(): string {
        switch (this.resClass.subClassOf[0]) {
            case Constants.AudioRepresentation:
                return 'audio_file';
            case Constants.ArchiveRepresentation:
                return 'folder_zip';
            case Constants.DocumentRepresentation:
                return 'description';
            case Constants.MovingImageRepresentation:
                return 'video_file';
            case Constants.StillImageRepresentation:
                return 'image';
            case Constants.TextRepresentation:
                return 'text_snippet';
            default: // resource does not have a file representation
                return 'insert_drive_file';
        }
    }

    private _getSearchCount() {
        this._dspApiConnection.v2.search
            .doExtendedSearchCountQuery(this.gravsearch)
            .subscribe(
                (res: CountQueryResponse) => {
                    this.results = res.numberOfResults;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }
}
