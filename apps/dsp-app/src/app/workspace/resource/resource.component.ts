/* eslint-disable @typescript-eslint/member-ordering */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Constants,
  CountQueryResponse,
  IHasPropertyWithPropertyDefinition,
  KnoraApiConnection,
  PermissionUtil,
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadLinkValue,
  ReadMovingImageFileValue,
  ReadProject,
  ReadResource,
  ReadResourceSequence,
  ReadStillImageFileValue,
  ReadTextFileValue,
  ReadUser,
  ReadValue,
  ResourceClassDefinitionWithPropertyDefinition,
  SystemPropertyDefinition,
  UpdateResourceMetadata,
  UpdateResourceMetadataResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events,
  ProjectService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  GetAttachedProjectAction,
  GetAttachedUserAction,
  ResourceSelectors,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, Subscription, combineLatest } from 'rxjs';
import { map, take, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ConfirmationWithComment, DialogComponent } from '../../main/dialog/dialog.component';
import { SplitSize } from '../results/results.component';
import { DspCompoundPosition, DspResource } from './dsp-resource';
import { PropertyInfoValues } from './properties/properties.component';
import { FileRepresentation, RepresentationConstants } from './representation/file-representation';
import { Region, StillImageComponent } from './representation/still-image/still-image.component';
import { IncomingService } from './services/incoming.service';
import { ResourceService } from './services/resource.service';
import {
  UpdatedFileEventValue,
  ValueOperationEventService,
  Events as ValueOperationEvents,
} from './services/value-operation-event.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss'],
  providers: [ValueOperationEventService], // provide service on the component level so that each implementation of this component has its own instance.
})
export class ResourceComponent implements OnChanges, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @ViewChild('stillImage') stillImageComponent: StillImageComponent;

  @Input() resourceIri: string;

  @Input() splitSizeChanged: SplitSize;

  @Output() regionChanged: EventEmitter<ReadValue> = new EventEmitter<ReadValue>();
  @Output() regionDeleted: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('matTabAnnotations') matTabAnnotations;

  oldResourceIri: string; // for change detection

  projectCode: string;

  resourceUuid: string;
  // used to store the uuid of the value that is parsed from the url params
  valueUuid: string;

  // this will be the main resource
  resource: DspResource;

  // in case of incoming representations,
  // this will be the currently selected (part-of main) resource
  incomingResource: DspResource;
  incomingResourceSub: Subscription;

  // for the annotations e.g. regions in a still image representation
  annotationResources: DspResource[];

  selectedRegion: string;

  selectedTab = 0;

  selectedTabLabel: string;

  resourceIsAnnotation: 'region' | 'sequence';

  // list of representations to be displayed
  // --> TODO: will be expanded with | MovingImageRepresentation[] | AudioRepresentation[] etc.
  representationsToDisplay: FileRepresentation[] = [];

  stillImageRepresentationsForCompoundResourceSub: Subscription;

  incomingRegionsSub: Subscription;

  representationConstants = RepresentationConstants;

  // in case of compound object,
  // this will store the current page position information
  compoundPosition: DspCompoundPosition;

  loading = true;

  refresh: boolean;

  navigationSubscription: Subscription;

  valueOperationEventSubscriptions: Subscription[] = [];

  showRestrictedMessage = true;

  attachedToProjectResource = '';

  project$ = this._store.select(ResourceSelectors.attachedProjects).pipe(
    takeWhile(attachedProjects => this.resource !== undefined && attachedProjects[this.resource.res.id] !== undefined),
    takeUntil(this.ngUnsubscribe),
    map(attachedProjects =>
      attachedProjects[this.resource.res.id].value.find(u => u.id === this.resource.res.attachedToProject)
    )
  );

  resourceAttachedUser: ReadUser;

  notification = this._notification;

  get userCanEdit(): boolean {
    if (!this.resource.res) {
      return false;
    }

    const allPermissions = PermissionUtil.allUserPermissions(
      this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
    );
    return allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
  }

  isAdmin$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    takeUntil(this.ngUnsubscribe),
    map(([user, userProjectGroups]) => {
      return this.attachedToProjectResource
        ? ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, this.attachedToProjectResource)
        : false;
    })
  );

  isEditor$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    takeUntil(this.ngUnsubscribe),
    map(([user, userProjectGroups]) => {
      return this.attachedToProjectResource
        ? ProjectService.IsProjectMemberOrAdminOrSysAdmin(user, userProjectGroups, this.attachedToProjectResource)
        : false;
    })
  );

  get resourceClassType(): ResourceClassDefinitionWithPropertyDefinition {
    return this.resource.res.entityInfo.classes[this.resource.res.type];
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _incomingService: IncomingService,
    private _notification: NotificationService,
    private _resourceService: ResourceService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _titleService: Title,
    private _valueOperationEventService: ValueOperationEventService,
    private _cdr: ChangeDetectorRef,
    private _store: Store,
    private _actions$: Actions,
    private _dialog: MatDialog,
    private _componentCommsService: ComponentCommunicationEventService
  ) {
    this._route.params.subscribe(params => {
      this.projectCode = params.project;
      this.resourceUuid = params.resource;
      this.valueUuid = params.value;
      if (this.projectCode && this.resourceUuid) {
        this.resourceIri = this._resourceService.getResourceIri(this.projectCode, this.resourceUuid);
        this.oldResourceIri = this.resourceIri;
        this.initResource(this.resourceIri);
      }
    });

    this._router.events.subscribe(event => {
      this._titleService.setTitle('Resource view');
    });

    this.valueOperationEventSubscriptions.push(
      this._valueOperationEventService.on(
        ValueOperationEvents.FileValueUpdated,
        (newFileValue: UpdatedFileEventValue) => {
          if (newFileValue) {
            if (this.resourceIri) {
              this.initResource(this.resourceIri);
            }
          }
        }
      )
    );
  }

  ngOnChanges() {
    // do not reload the whole resource when the iri did not change
    if (this.oldResourceIri === this.resourceIri) {
      return;
    }

    this.loading = true;
    // reset all resources
    this.resource = undefined;
    this.incomingResource = undefined;
    this.compoundPosition = undefined;
    this.showRestrictedMessage = true;
    // get resource with all necessary information
    // incl. incoming resources and annotations
    if (this.resourceIri) {
      this.initResource(this.resourceIri);
    }
  }

  ngOnDestroy() {
    if (this.navigationSubscription !== undefined) {
      this.navigationSubscription.unsubscribe();
    }

    // unsubscribe from the ValueOperationEventService when component is destroyed
    if (this.valueOperationEventSubscriptions !== undefined) {
      this.valueOperationEventSubscriptions.forEach(sub => sub.unsubscribe());
    }
    if (this.stillImageRepresentationsForCompoundResourceSub) {
      this.stillImageRepresentationsForCompoundResourceSub.unsubscribe();
    }

    if (this.incomingRegionsSub) {
      this.incomingRegionsSub.unsubscribe();
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // reload the page with the same resource
  reloadWithResource() {
    this.oldResourceIri = undefined;
    this.ngOnChanges();
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
    const position = Math.floor(page - offset * 25 - 1);

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
    this.representationsToDisplay = this.collectRepresentationsAndAnnotations(this.incomingResource);
  }

  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // get and display resource
  // ------------------------------------------------------------------------
  initResource(iri) {
    this.oldResourceIri = this.resourceIri;
    this.getResource(iri).subscribe(dspResource => {
      this._getResourceAttachedData(dspResource);
      this.renderResource(dspResource);
    });
  }

  getResource(iri: string): Observable<DspResource> {
    return this._dspApiConnection.v2.res
      .getResource(iri)
      .pipe(map((response: ReadResource) => new DspResource(response)));
  }

  renderResource(resource: DspResource) {
    if (resource.res.isDeleted) {
      // guard; not yet implemented
      return;
    }
    if (resource.isRegion) {
      // render the image onto which the region is pointing; a region
      // itself can not be displayed without an image it is annotating
      this.renderAsRegion(resource);
    } else {
      this.renderAsMainResource(resource);
    }

    this.attachedToProjectResource = resource.res.attachedToProject;
    this._cdr.markForCheck();
  }

  renderAsMainResource(resource: DspResource) {
    this.resource = resource;
    this.oldResourceIri = this.resourceIri;

    this.representationsToDisplay = this.collectRepresentationsAndAnnotations(resource);
    if (!this.representationsToDisplay.length && !this.compoundPosition) {
      // the resource could be a compound object
      if (this.stillImageRepresentationsForCompoundResourceSub) {
        this.stillImageRepresentationsForCompoundResourceSub.unsubscribe();
      }
      this.stillImageRepresentationsForCompoundResourceSub = this._incomingService
        .getStillImageRepresentationsForCompoundResource(resource.res.id, 0, true)
        .pipe(
          tap({
            error: () => {
              this.loading = false;
              this._cdr.markForCheck();
            },
          })
        )
        .subscribe((countQuery: CountQueryResponse) => {
          if (countQuery.numberOfResults > 0) {
            // this is a compound object
            this.compoundPosition = new DspCompoundPosition(countQuery.numberOfResults);
            this.compoundNavigation(1);
          } else {
            this.loading = false;
          }
          this._cdr.markForCheck();
        });
    } else {
      this.requestIncomingResources(resource);
    }

    // gather resource property information
    this.resource.resProps = this.initProps(this.resource.res);

    // gather system property information
    this.resource.systemProps = this.resource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);
  }

  renderAsRegion(region: DspResource) {
    // display the corresponding still-image resource instance
    // find the iri of the parent resource; still-image in case of region, moving-image or audio in case of sequence
    const annotatedRepresentationIri = (region.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
      .linkedResourceIri;
    // get the annotated main resource
    this.getResource(annotatedRepresentationIri).subscribe(dspResource => {
      this.resource = dspResource;
      this.renderAsMainResource(dspResource);

      // open annotation`s tab and highlight region
      this.selectedTabLabel = 'annotations';
      this.openRegion(region.res.id);

      this.selectedRegion = region.res.id;
      // define resource as annotation of type region
      this.resourceIsAnnotation = this.resource.res.entityInfo.classes[Constants.Region] ? 'region' : 'sequence';
    });
  }

  // return whether the main resource
  get isMainResourceToDisplay() {
    return this.resource.res.id === this.resourceIri;
  }

  renderRegion(iri) {
    // display the corresponding still-image resource instance
    // find the iri of the parent resource; still-image in case of region, moving-image or audio in case of sequence
    const annotationOfIri = (this.resource.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
      .linkedResourceIri;

    // get the parent resource to display
    this.getResource(annotationOfIri);

    // open annotation`s tab and highlight region
    this.selectedTabLabel = 'annotations';
    this.openRegion(iri);

    this.selectedRegion = iri;
    // define resource as annotation of type region
    this.resourceIsAnnotation = this.resource.res.entityInfo.classes[Constants.Region] ? 'region' : 'sequence';
  }

  getIncomingResource(iri: string) {
    if (this.incomingResourceSub) {
      this.incomingResourceSub.unsubscribe();
    }
    this.incomingResourceSub = this._dspApiConnection.v2.res.getResource(iri).subscribe((response: ReadResource) => {
      const res = new DspResource(response);

      this.incomingResource = res;
      this.incomingResource.resProps = this.initProps(response);
      this.incomingResource.systemProps =
        this.incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

      this.representationsToDisplay = this.collectRepresentationsAndAnnotations(this.incomingResource);
      if (this.representationsToDisplay.length && this.representationsToDisplay[0].fileValue && this.compoundPosition) {
        this.getIncomingRegions(this.incomingResource, 0);
      }

      this._cdr.markForCheck();
    });
  }

  tabChanged(e: MatTabChangeEvent) {
    if (e.tab.textLabel === 'annotations') {
      this.stillImageComponent?.renderRegions();
    } else {
      this.stillImageComponent?.removeOverlays();
    }
    this.selectedTabLabel = e.tab.textLabel;
  }

  representationLoaded(e: boolean) {
    this.loading = !e;
    this._cdr.detectChanges();
  }

  resourceClassLabel = (resource: DspResource): string => resource.res.entityInfo?.classes[resource.res.type].label;

  resourceLabel = (incomingResource: DspResource, resource: DspResource): string =>
    incomingResource ? `${resource.res.label}: ${incomingResource.res.label}` : resource.res.label;

  openProject(project: ReadProject) {
    window.open(`${RouteConstants.projectRelative}/${ProjectService.IriToUuid(project.id)}`, '_blank');
  }

  previewProject() {
    // --> TODO: pop up project preview on hover
  }

  /**
   * gather resource property information
   */
  protected initProps(resource: ReadResource): PropertyInfoValues[] {
    let props = resource.entityInfo.classes[resource.type]
      .getResourcePropertiesList()
      .map((prop: IHasPropertyWithPropertyDefinition) => {
        let propInfoAndValues: PropertyInfoValues;

        switch (prop.propertyDefinition.objectType) {
          case Constants.StillImageFileValue:
            propInfoAndValues = {
              propDef: prop.propertyDefinition,
              guiDef: prop,
              values: resource.getValuesAs(prop.propertyIndex, ReadStillImageFileValue),
            };

            const stillImageRepresentations = [
              new FileRepresentation(
                resource.getValuesAs(Constants.HasStillImageFileValue, ReadStillImageFileValue)[0],
                []
              ),
            ];

            this.representationsToDisplay = stillImageRepresentations;
            // --> TODO: get regions here

            break;

          default:
            // the object type is none from above
            propInfoAndValues = {
              propDef: prop.propertyDefinition,
              guiDef: prop,
              values: resource.getValues(prop.propertyIndex),
            };
        }
        return propInfoAndValues;
      });

    // sort properties by guiOrder
    props = props
      .filter(
        prop =>
          prop.propDef.objectType !== Constants.GeomValue &&
          !prop.propDef.objectType.includes(Constants.StillImageAbstractFileValue)
      )
      .sort((a, b) => (a.guiDef.guiOrder > b.guiDef.guiOrder ? 1 : -1))
      // to get equal results on all browser engines which implements sorting in different way
      // properties list has to be sorted again, pushing all "has..." properties to the bottom
      // TODO FOLLOWING LINE IS A BUG ARRAY-CALLBACK-RETURN SHOULDNT BE DISABLED
      // eslint-disable-next-line array-callback-return
      .sort(a => {
        if (a.guiDef.guiOrder === undefined) {
          return 1;
        }
      });

    return props;
  }

  /**
   * creates a collection of [[StillImageRepresentation]] belonging to the given resource and assigns it to it.
   * each [[StillImageRepresentation]] represents an image including regions.
   *
   * @param resource The resource to get the images for.
   * @returns A collection of images for the given resource.
   */
  protected collectRepresentationsAndAnnotations(resource: DspResource): FileRepresentation[] {
    if (!resource) {
      return;
    }

    // general object for all kind of representations
    const representations: FileRepresentation[] = [];

    // --> TODO: use proper classes and a factory
    if (resource.res.properties[Constants.HasStillImageFileValue]) {
      // --> TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
      // resource has StillImageFileValues that are directly attached to it (properties)

      const fileValues: ReadStillImageFileValue[] = resource.res.properties[
        Constants.HasStillImageFileValue
      ] as ReadStillImageFileValue[];
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
      const fileValues: ReadDocumentFileValue[] = resource.res.properties[
        Constants.HasDocumentFileValue
      ] as ReadDocumentFileValue[];
      for (const doc of fileValues) {
        const document = new FileRepresentation(doc);
        representations.push(document);
      }
    } else if (resource.res.properties[Constants.HasAudioFileValue]) {
      const fileValue: ReadAudioFileValue = resource.res.properties[
        Constants.HasAudioFileValue
      ][0] as ReadAudioFileValue;
      const audio = new FileRepresentation(fileValue);
      representations.push(audio);
    } else if (resource.res.properties[Constants.HasMovingImageFileValue]) {
      const fileValue: ReadMovingImageFileValue = resource.res.properties[
        Constants.HasMovingImageFileValue
      ][0] as ReadMovingImageFileValue;
      const video = new FileRepresentation(fileValue);
      representations.push(video);
    } else if (resource.res.properties[Constants.HasArchiveFileValue]) {
      const fileValue: ReadArchiveFileValue = resource.res.properties[
        Constants.HasArchiveFileValue
      ][0] as ReadArchiveFileValue;
      const archive = new FileRepresentation(fileValue);
      representations.push(archive);
    } else if (resource.res.properties[Constants.HasTextFileValue]) {
      const fileValue: ReadTextFileValue = resource.res.properties[Constants.HasTextFileValue][0] as ReadTextFileValue;
      const text = new FileRepresentation(fileValue);
      representations.push(text);
    }
    return representations;
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
    if (this.stillImageRepresentationsForCompoundResourceSub) {
      this.stillImageRepresentationsForCompoundResourceSub.unsubscribe();
    }
    this.stillImageRepresentationsForCompoundResourceSub = this._incomingService
      .getStillImageRepresentationsForCompoundResource(this.resource.res.id, offset)
      .subscribe((incomingImageRepresentations: ReadResourceSequence) => {
        if (!this.resource) {
          return; // if there is no resource anymore when the response arrives, do nothing
        }
        if (incomingImageRepresentations.resources.length > 0) {
          // set the incoming representations for the current offset only
          this.resource.incomingRepresentations = incomingImageRepresentations.resources;
          this.getIncomingResource(this.resource.incomingRepresentations[this.compoundPosition.position].id);
        } else {
          this.loading = false;
          this.representationsToDisplay = [];
        }
        this._cdr.markForCheck();
      });
  }

  /**
   * requests incoming resources for [[this.resource]].
   * Incoming resources are: regions, representations, and incoming links.
   */
  protected requestIncomingResources(resource: DspResource): void {
    // make sure that this resource has been initialized correctly
    if (resource === undefined) {
      return;
    }

    // request incoming regions --> TODO: add case to get incoming sequences in case of video and audio
    if (resource.res.properties[Constants.HasStillImageFileValue]) {
      // --> TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
      // the resource is a StillImageRepresentation, check if there are regions pointing to it

      this.getIncomingRegions(resource, 0);
    } else if (this.compoundPosition) {
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
    if (this.incomingRegionsSub) {
      this.incomingRegionsSub.unsubscribe();
    }
    this.incomingRegionsSub = this._incomingService
      .getIncomingRegions(resource.res.id, offset)
      .subscribe((regions: ReadResourceSequence) => {
        // append elements of regions.resources to resource.incoming
        Array.prototype.push.apply(resource.incomingAnnotations, regions.resources);

        // this.annotationResources.push(regions.resources)

        // prepare regions to be displayed
        // triggers ngOnChanges of StillImageComponent
        this.representationsToDisplay = this.collectRepresentationsAndAnnotations(resource);
        this._cdr.markForCheck();
      });
  }

  /**
   * get resources pointing to [[this.resource]] with properties other than knora-api:isPartOf and knora-api:isRegionOf.
   *
   * @param offset the offset to be used (needed for paging). First request uses an offset of 0.
   * It takes the number of images returned as an argument.
   */
  protected getIncomingLinks(offset: number): void {
    this._incomingService
      .getIncomingLinksForResource(this.resource?.res.id, offset)
      .subscribe((incomingResources: ReadResourceSequence) => {
        // Check if incomingReferences is initialized, if not, initialize it as an empty array
        if (!this.resource?.res.incomingReferences) {
          this.resource.res.incomingReferences = [];
        }
        // append elements incomingResources to this.resource.incomingLinks
        Array.prototype.push.apply(this.resource?.res.incomingReferences, incomingResources.resources);
      });
  }

  openRegion(iri: string) {
    // open annotation tab
    this.selectedTab = this.incomingResource ? 2 : 1;

    // activate the selected region
    this.selectedRegion = iri;

    // and scroll to region with this id
    const region = document.getElementById(iri);
    if (region) {
      region.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  updateRegions(iri: string) {
    if (this.incomingResource) {
      this.incomingResource.incomingAnnotations = [];
    } else {
      this.resource.incomingAnnotations = [];
    }
    this.getIncomingRegions(this.incomingResource ? this.incomingResource : this.resource, 0);
    this.openRegion(iri);
  }

  updateRegion() {
    if (this.stillImageComponent !== undefined) {
      this.stillImageComponent.updateRegions();
    }
  }

  openEditDialog() {
    const dialogRef = this._dialog.open(DialogComponent, {
      data: { mode: `editResource`, title: this.resource.res.label },
    });
    dialogRef.afterClosed().subscribe((answer: ConfirmationWithComment) => {
      if (answer.confirmed === true && this.resource.res.label !== answer.comment) {
        // update resource's label if it has changed
        // get the correct lastModificationDate from the resource
        this._dspApiConnection.v2.res.getResource(this.resource.res.id).subscribe((res: ReadResource) => {
          const payload = new UpdateResourceMetadata();
          payload.id = this.resource.res.id;
          payload.type = this.resource.res.type;
          payload.lastModificationDate = res.lastModificationDate;
          payload.label = answer.comment;

          this._dspApiConnection.v2.res
            .updateResourceMetadata(payload)
            .subscribe((response: UpdateResourceMetadataResponse) => {
              this.resource.res.label = payload.label;
              this.resource.res.lastModificationDate = response.lastModificationDate;
              // if annotations tab is active; a label of a region has been changed --> update regions
              this._componentCommsService.emit(new EmitEvent(Events.resourceChanged));
              if (this.matTabAnnotations && this.matTabAnnotations.isActive) {
                this.regionChanged.emit();
              }
              this._cdr.markForCheck();
            });
        });
      }
    });
  }

  private _getResourceAttachedData(resource: DspResource): void {
    this._actions$
      .pipe(ofActionSuccessful(GetAttachedUserAction))
      .pipe(take(1))
      .subscribe(() => {
        const attachedUsers = this._store.selectSnapshot(ResourceSelectors.attachedUsers);
        this.resourceAttachedUser = attachedUsers[resource.res.id].value.find(
          u => u.id === resource.res.attachedToUser
        );
      });
    this._store.dispatch([
      new GetAttachedUserAction(resource.res.id, resource.res.attachedToUser),
      new GetAttachedProjectAction(resource.res.id, resource.res.attachedToProject),
    ]);
  }
}
