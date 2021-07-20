/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
    ActivatedRoute,
    NavigationEnd,
    NavigationError,
    NavigationStart,
    Router
} from '@angular/router';
import {
    ApiResponseError,
    Constants,
    CountQueryResponse,
    DeleteResourceResponse,
    IHasPropertyWithPropertyDefinition,
    KnoraApiConnection,
    ReadDocumentFileValue, ReadResource,
    ReadResourceSequence,
    ReadStillImageFileValue, SystemPropertyDefinition
} from '@dasch-swiss/dsp-js';
import {
    DspApiConnectionToken,
    NotificationService,
    PropertyInfoValues,
    Session,
    SessionService,
    ValueOperationEventService
} from '@dasch-swiss/dsp-ui';
import { Subscription } from 'rxjs';
import { DspCompoundPosition, DspResource } from './dsp-resource';
import { IncomingService } from './incoming.service';
import { FileRepresentation, RepresentationConstants } from './representation/file-representation';
import { Region } from './representation/still-image/still-image.component';

@Component({
    selector: 'app-resource',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss'],
    providers: [ValueOperationEventService] // provide service on the component level so that each implementation of this component has its own instance.
})
export class ResourceComponent implements OnInit, OnChanges, OnDestroy {

    @Input() resourceIri: string;

    // this will be the main resource
    resource: DspResource;

    // in case of incoming representations,
    // this will be the currently selected (part-of main) resource
    incomingResource: DspResource;

    // for the annotations e.g. regions in a still image representation
    annotationResources: DspResource[];

    selectedRegion: string;

    selectedTab = 0;

    // list of representations to be displayed
    // --> TODO: will be expanded with | MovingImageRepresentation[] | AudioRepresentation[] etc.
    representationsToDisplay: FileRepresentation[] = [];

    representationConstants = RepresentationConstants;

    // in case of compound object,
    // this will store the current page position information
    compoundPosition: DspCompoundPosition;

    showAllProps = false;

    loading = true;

    refresh: boolean;

    // permissions of logged-in user
    session: Session;
    adminPermissions = false;
    editPermissions = false;

    navigationSubscription: Subscription;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _incomingService: IncomingService,
        private _notification: NotificationService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _titleService: Title
    ) {

        this._route.params.subscribe(params => {
            this.resourceIri = params['id'];
            this.getResource(this.resourceIri);
        });

        this._router.events.subscribe((event) => {

            this._titleService.setTitle('Resource view');

            if (event instanceof NavigationStart) {
                // show loading indicator
                // console.log('NavigationStart', this.resourceIri);
            }

            if (event instanceof NavigationEnd) {
                // hide loading indicator
                this.refresh = true;
                // console.log('NavigationEnd', this.resourceIri);
                this.refresh = false;
            }

            if (event instanceof NavigationError) {
                // hide loading indicator

                // present error to user
                this._notification.openSnackBar(event.error);

            }

        });
    }

    ngOnInit() {

    }

    ngOnChanges() {
        // reset all resources
        this.resource = undefined;
        this.incomingResource = undefined;
        this.representationsToDisplay = [];
        this.compoundPosition = undefined;

        // get resource with all necessary information
        // incl. incoming resources and annotations
        if (this.resourceIri) {
            this.getResource(this.resourceIri);
        }
    }

    ngOnDestroy() {
        if (this.navigationSubscription !== undefined) {
            this.navigationSubscription.unsubscribe();
        }
    }


    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // general methods
    // ------------------------------------------------------------------------

    compoundNavigation(page: number) {
        this.selectedRegion = undefined;

        this.representationsToDisplay = [];

        // set current compound object position:
        // calculate offset and offset item position from current page and total pages info
        const offset = Math.ceil(page / 25) - 1;
        const position = Math.floor(page - (offset * 25) - 1);

        // get incoming still image representations, if the offset changed
        if (offset !== this.compoundPosition.offset) {
            this.compoundPosition.offset = offset;
            this.getIncomingStillImageRepresentations(offset);
        } else {
            // get incoming resource, if the offset is the same but page changed
            this.getIncomingResource(this.resource.incomingRepresentations[position].id);
        }

        this.compoundPosition.position = position;
        this.compoundPosition.page = page;

        this.collectRepresentationsAndAnnotations(this.incomingResource);

    }

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // get and display resource
    // ------------------------------------------------------------------------

    /**
     * get a read resource sequence with ontology information and incoming resources.
     *
     * @param iri resourceIri
     */
    getResource(iri: string, incoming: boolean = false): void {
        if (!iri) {
            return;
        }

        this._dspApiConnection.v2.res.getResource(iri).subscribe(
            (response: ReadResource) => {
                const res = new DspResource(response);

                this.resource = res;

                // get information about the logged-in user, if one is logged-in
                if (this._session.getSession()) {
                    this.session = this._session.getSession();
                    // is the logged-in user project member?
                    // --> TODO: as soon as we know how to handle the permissions, set this value the correct way
                    this.editPermissions = true;
                    // is the logged-in user system admin or project admin?
                    this.adminPermissions = this.session.user.sysAdmin ? this.session.user.sysAdmin : this.session.user.projectAdmin.some(e => e === res.res.attachedToProject);
                }

                this.collectRepresentationsAndAnnotations(this.resource);

                if (!this.representationsToDisplay.length && !this.compoundPosition) {
                    // the resource could be a compound object
                    this._incomingService.getStillImageRepresentationsForCompoundResource(this.resource.res.id, 0, true).subscribe(
                        (countQuery: CountQueryResponse) => {

                            if (countQuery.numberOfResults > 0) {
                                this.compoundPosition = new DspCompoundPosition(countQuery.numberOfResults);
                                this.compoundNavigation(1);
                            }
                        },
                        (error: ApiResponseError) => {
                            this._notification.openSnackBar(error);
                        }
                    );
                } else {
                    this.requestIncomingResources(this.resource);
                }

                // gather resource property information
                res.resProps = this.initProps(response);

                // gather system property information
                res.systemProps = this.resource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this.loading = false;
                if (error.status === 404) {
                    // resource not found: maybe it's deleted or the iri is wrong
                    // display message that it couldn't be found

                } else {
                    this._notification.openSnackBar(error);
                }

            }
        );
    }

    getIncomingResource(iri: string) {
        this._dspApiConnection.v2.res.getResource(iri).subscribe(
            (response: ReadResource) => {
                const res = new DspResource(response);

                this.incomingResource = res;
                res.resProps = this.initProps(response);
                res.systemProps = this.incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

                this.collectRepresentationsAndAnnotations(this.incomingResource);

                if (this.representationsToDisplay.length && this.compoundPosition) {
                    this.getIncomingRegions(this.incomingResource, 0);
                }
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        );
    }
    /**
     * gather resource property information
     */
    protected initProps(resource: ReadResource): PropertyInfoValues[] {
        let props = resource.entityInfo.classes[resource.type].getResourcePropertiesList().map(
            (prop: IHasPropertyWithPropertyDefinition) => {
                let propInfoAndValues: PropertyInfoValues;

                switch (prop.propertyDefinition.objectType) {
                    case Constants.StillImageFileValue:
                        propInfoAndValues = {
                            propDef: prop.propertyDefinition,
                            guiDef: prop,
                            values: resource.getValuesAs(prop.propertyIndex, ReadStillImageFileValue)
                        };

                        const stillImageRepresentations = [new FileRepresentation(
                            resource.getValuesAs(Constants.HasStillImageFileValue, ReadStillImageFileValue)[0], [])
                        ];

                        this.representationsToDisplay = stillImageRepresentations;

                        // --> TODO: get regions here

                        break;

                    default:
                        // the object type is none from above
                        propInfoAndValues = {
                            propDef: prop.propertyDefinition,
                            guiDef: prop,
                            values: resource.getValues(prop.propertyIndex)
                        };
                }

                return propInfoAndValues;
            }
        );

        // sort properties by guiOrder
        props = props
            .filter(prop => prop.propDef.objectType !== Constants.GeomValue)
            .sort((a, b) => (a.guiDef.guiOrder > b.guiDef.guiOrder) ? 1 : -1);

        return props;
    }

    /**
     * creates a collection of [[StillImageRepresentation]] belonging to the given resource and assigns it to it.
     * each [[StillImageRepresentation]] represents an image including regions.
     *
     * @param resource The resource to get the images for.
     * @returns A collection of images for the given resource.
     */
    protected collectRepresentationsAndAnnotations(resource: DspResource): any {

        if (!resource) {
            return;
        }

        // --> TODO: should be a general object for all kind of representations
        const representations: FileRepresentation[] = [];

        // --> TODO: use a switch here to go throught the different representation types
        if (resource.res.properties[Constants.HasStillImageFileValue]) {
            // --> TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
            // resource has StillImageFileValues that are directly attached to it (properties)

            const fileValues: ReadStillImageFileValue[] = resource.res.properties[Constants.HasStillImageFileValue] as ReadStillImageFileValue[];

            for (const img of fileValues) {

                const regions: Region[] = [];

                const annotations: DspResource[] = [];

                for (const incomingRegion of resource.incomingAnnotations) {

                    const region = new Region(incomingRegion);
                    regions.push(region);

                    const annotation = new DspResource(incomingRegion);

                    // gather region property information
                    annotation.resProps = this.initProps(incomingRegion);

                    // gather system property information
                    annotation.systemProps = incomingRegion.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

                    annotations.push(annotation);

                }

                const stillImage = new FileRepresentation(img, regions);

                representations.push(stillImage);

                this.annotationResources = annotations;
            }

        } else if (resource.res.properties[Constants.HasDocumentFileValue]) {

            const fileValues: ReadDocumentFileValue[] = resource.res.properties[Constants.HasDocumentFileValue] as ReadDocumentFileValue[];
            for (const doc of fileValues) {

                const document = new FileRepresentation(doc);
                representations.push(document);
            }

        }
        this.representationsToDisplay = representations;

    }

    /**
     * get StillImageRepresentations pointing to [[this.resource]].
     * This method may have to called several times with an increasing offsetChange in order to get all available StillImageRepresentations.
     *
     * @param offset the offset to be used (needed for paging). First request uses an offset of 0.
     * It takes the number of images returned as an argument.
     */
    protected getIncomingStillImageRepresentations(offset: number): void {
        // make sure that this.resource has been initialized correctly
        if (this.resource === undefined) {
            return;
        }

        if (offset < 0 || offset > this.compoundPosition.maxOffsets) {
            this._notification.openSnackBar(`Offset of ${offset} is invalid`);
            return;
        }

        // get all representations for compound resource of this offset sequence
        this._incomingService.getStillImageRepresentationsForCompoundResource(this.resource.res.id, offset).subscribe(
            (incomingImageRepresentations: ReadResourceSequence) => {

                if (incomingImageRepresentations.resources.length > 0) {

                    // set the incoming representations for the current offset only
                    this.resource.incomingRepresentations = incomingImageRepresentations.resources;
                    this.getIncomingResource(this.resource.incomingRepresentations[this.compoundPosition.position].id);

                }
            },
            (error: any) => {
                this._notification.openSnackBar(error);
            }
        );

    }

    /**
     * requests incoming resources for [[this.resource]].
     * Incoming resources are: regions, StillImageRepresentations, and incoming links.
     */
    protected requestIncomingResources(resource: DspResource): void {

        // make sure that this resource has been initialized correctly
        if (resource === undefined) {
            return;
        }

        // request incoming regions --> TODO: add case to get incoming sequences in case of video and audio
        if (resource.res.properties[Constants.HasStillImageFileValue] || resource.res.properties[Constants.HasDocumentFileValue]) {
            // --> TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
            // the resource is a StillImageRepresentation, check if there are regions pointing to it

            this.getIncomingRegions(resource, 0);

        } else {
            // this resource is not a StillImageRepresentation
            // check if there are StillImageRepresentations pointing to this resource

            // this gets the first page of incoming StillImageRepresentations
            // more pages may be requested by [[this.viewer]].
            this.getIncomingStillImageRepresentations(this.compoundPosition.offset);
        }

        // check for incoming links for the current resource
        this.getIncomingLinks(0);

    }

    /**
     * gets the incoming regions for [[this.resource]].
     *
     * @param offset the offset to be used (needed for paging). First request uses an offset of 0.
     */
    protected getIncomingRegions(resource: DspResource, offset: number): void {
        this._incomingService.getIncomingRegions(resource.res.id, offset).subscribe(
            (regions: ReadResourceSequence) => {

                // append elements of regions.resources to resource.incoming
                Array.prototype.push.apply(resource.incomingAnnotations, regions.resources);

                // this.annotationResources.push(regions.resources)

                // prepare regions to be displayed
                // triggers ngOnChanges of StillImageComponent
                this.collectRepresentationsAndAnnotations(resource);


            },
            (error: any) => {
                this._notification.openSnackBar(error);
            }
        );
    }

    /**
     * get resources pointing to [[this.resource]] with properties other than knora-api:isPartOf and knora-api:isRegionOf.
     *
     * @param offset the offset to be used (needed for paging). First request uses an offset of 0.
     * It takes the number of images returned as an argument.
     */
    protected getIncomingLinks(offset: number): void {

        this._incomingService.getIncomingLinksForResource(this.resource.res.id, offset).subscribe(
            (incomingResources: ReadResourceSequence) => {

                // append elements incomingResources to this.resource.incomingLinks
                Array.prototype.push.apply(this.resource.res.incomingReferences, incomingResources.resources);
            },
            (error: any) => {
                this._notification.openSnackBar(error);
            }
        );
    }

    openRegion(iri: string) {
        // open annotation tab
        this.selectedTab = (this.incomingResource ? 2 : 1);

        // activate the selected region
        this.selectedRegion = iri;

        // and scroll to region with this id
        const region = document.getElementById(iri);
        if (region) {
            region.scrollIntoView();
        }

    }
}
