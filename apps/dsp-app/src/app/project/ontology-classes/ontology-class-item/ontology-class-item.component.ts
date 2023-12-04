import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {
    ClassDefinition,
    KnoraApiConnection,
    CountQueryResponse,
    ApiResponseError,
    Constants,
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import {DspApiConnectionToken, RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import {
    ComponentCommunicationEventService,
    EmitEvent,
    Events,
} from '@dsp-app/src/app/main/services/component-communication-event.service';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-ontology-class-item',
    templateUrl: './ontology-class-item.component.html',
    styleUrls: ['./ontology-class-item.component.scss'],
})
export class OntologyClassItemComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() resClass: ClassDefinition;

    @Input() projectMember: boolean;

    @ViewChild('resClassLabel') resClassLabel: ElementRef;

    gravsearch: string;

    results: number;

    classLink: string;

    icon: string;

    componentCommsSubscriptions: Subscription[] = [];

    tooltipDisabled = true;

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
        private _errorHandler: AppErrorHandler,
        private _route: ActivatedRoute,
        private _componentCommsService: ComponentCommunicationEventService,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        const uuid = this._route.snapshot.params.uuid;
        const splitIri = this.resClass.id.split('#');
        const ontologyName = OntologyService.getOntologyName(splitIri[0]);
        this.classLink = `${RouteConstants.projectRelative}/${uuid}/${RouteConstants.ontology}/${ontologyName}/${splitIri[1]}`;

        this.gravsearch = this._setGravsearch(this.resClass.id);

        // get number of resource instances
        this._getSearchCount();

        this.icon = this._getIcon();

        this.componentCommsSubscriptions.push(
            this._componentCommsService.on(Events.resourceDeleted, () => {
                this._getSearchCount();
            })
        );

        this.componentCommsSubscriptions.push(
            this._componentCommsService.on(Events.resourceCreated, () => {
                this._getSearchCount();
            })
        );

    }

    ngAfterViewInit(): void {
        this.tooltipDisabled = !this.isTextOverflowing(this.resClassLabel.nativeElement);
        this._cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this.componentCommsSubscriptions.forEach((sub) => sub.unsubscribe());
    }

    selectItem() {
        this._componentCommsService.emit(
            new EmitEvent(Events.unselectedListItem)
        );
    }

    isTextOverflowing(element: HTMLElement): boolean {
        if (element) {
            return element.scrollHeight > element.clientHeight;
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
                    this._cdr.markForCheck();
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }

    getAddClassInstanceLink(): string {
        return `${this.classLink}/${RouteConstants.addClassInstance}`;
    }
}
