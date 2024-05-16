import { ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Constants,
  CountQueryResponse,
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
  ResourceClassDefinitionWithPropertyDefinition,
  SystemPropertyDefinition,
} from '@dasch-swiss/dsp-js';
import {
  Common,
  DspCompoundPosition,
  DspResource,
  PropertyInfoValues,
  ResourceService,
} from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken, DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import {
  Events as CommsEvents,
  ComponentCommunicationEventService,
  ProjectService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  EditResourceLabelDialogComponent,
  EditResourceLabelDialogProps,
  IncomingService,
} from '@dasch-swiss/vre/shared/app-resource-properties';
import {
  GetAttachedUserAction,
  LoadResourceAction,
  ResourceSelectors,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, Subscription, combineLatest } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { FileRepresentation, RepresentationConstants } from './representation/file-representation';
import { Region, StillImageComponent } from './representation/still-image/still-image.component';
import { Events, UpdatedFileEventValue, ValueOperationEventService } from './services/value-operation-event.service';

@Component({
  selector: 'app-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss'],
  providers: [ValueOperationEventService], // provide service on the component level so that each implementation of this component has its own instance.
})
export class ResourceComponent implements OnChanges, OnInit, OnDestroy {
  @Input() resourceIri: string;
  @ViewChild('stillImage') stillImageComponent: StillImageComponent;
  @ViewChild('matTabAnnotations') matTabAnnotations;

  oldResourceIri: string; // for change detection
  resource: DspResource;
  incomingResource: DspResource;
  annotationResources: DspResource[];
  selectedRegion: string;
  selectedTab = 0;
  selectedTabLabel: string;
  representationsToDisplay: FileRepresentation[] = [];
  compoundPosition: DspCompoundPosition;
  loading = true;
  valueOperationEventSubscriptions: Subscription[] = [];
  showRestrictedMessage = true;
  resourceProperties: PropertyInfoValues[];

  readonly representationConstants = RepresentationConstants;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

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

  get attachedToProjectResource(): string {
    return this.resource.res.attachedToProject;
  }

  get userCanEdit(): boolean {
    if (!this.resource.res) {
      return false;
    }

    const allPermissions = PermissionUtil.allUserPermissions(
      this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
    );
    return allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
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
      const projectCode = params.project;
      const resourceUuid = params.resource;
      if (projectCode && resourceUuid) {
        this.resourceIri = this._resourceService.getResourceIri(projectCode, resourceUuid);
        this.oldResourceIri = this.resourceIri;
        this._initResource(this.resourceIri);
      }
    });

    this._router.events.subscribe(() => {
      this._titleService.setTitle('Resource view');
    });

    this._componentCommsService.on(CommsEvents.resourceChanged, () => this._initResource(this.resourceIri));
    this.valueOperationEventSubscriptions.push(
      this._valueOperationEventService.on(Events.FileValueUpdated, (newFileValue: UpdatedFileEventValue) => {
        if (newFileValue) {
          if (this.resourceIri) {
            this._initResource(this.resourceIri);
          }
        }
      })
    );
  }

  ngOnInit() {
    this._store
      .select(ResourceSelectors.resource)
      .pipe(filter(resource => resource !== null))
      .subscribe(res => {
        this.resource = res;

        this.resourceProperties = res.resProps
          .filter(prop => !prop.propDef['isLinkProperty'])
          .filter(
            prop => !prop.propDef.subPropertyOf.includes('http://api.knora.org/ontology/knora-api/v2#hasFileValue')
          );
        this.loading = false;
        this._cdr.detectChanges();
      });
  }

  ngOnChanges() {
    // do not reload the whole resource when the iri did not change
    if (this.oldResourceIri === this.resourceIri) {
      return;
    }

    this.loading = true;
    // reset all resources
    this.incomingResource = undefined;
    this.compoundPosition = undefined;
    this.showRestrictedMessage = true;
    // get resource with all necessary information
    // incl. incoming resources and annotations
    if (this.resourceIri) {
      this._initResource(this.resourceIri);
    }
  }

  ngOnDestroy() {
    // unsubscribe from the ValueOperationEventService when component is destroyed
    if (this.valueOperationEventSubscriptions !== undefined) {
      this.valueOperationEventSubscriptions.forEach(sub => sub.unsubscribe());
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

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
      this._getIncomingStillImageRepresentations(offset);
    } else {
      // get incoming resource, if the offset is the same but page changed
      this._getIncomingResource(this.resource.incomingRepresentations[position].id);
    }
    this.compoundPosition.position = position;
    this.compoundPosition.page = page;
    this.representationsToDisplay = this._collectRepresentationsAndAnnotations(this.incomingResource);
  }

  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // get and display resource
  // ------------------------------------------------------------------------

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

  resourceLabel = (incomingResource: DspResource, resource: DspResource) => {
    return incomingResource ? `${resource.res.label}: ${incomingResource.res.label}` : resource.res.label;
  };

  openProject(project: ReadProject) {
    window.open(`${RouteConstants.projectRelative}/${ProjectService.IriToUuid(project.id)}`, '_blank');
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
    this._getIncomingRegions(this.incomingResource ? this.incomingResource : this.resource, 0);
    this.openRegion(iri);
  }

  openEditLabelDialog() {
    this._dialog
      .open<EditResourceLabelDialogComponent, EditResourceLabelDialogProps, boolean>(
        EditResourceLabelDialogComponent,
        DspDialogConfig.smallDialog<EditResourceLabelDialogProps>({ resource: this.resource.res })
      )
      .afterClosed()
      .subscribe(response => {
        if (!response) return;
        this._cdr.markForCheck();
      });
  }

  trackAnnotationByFn = (index: number, item: DspResource) => `${index}-${item.res.id}`;

  /**
   * get resources pointing to [[this.resource]] with properties other than knora-api:isPartOf and knora-api:isRegionOf.
   *
   * @param offset the offset to be used (needed for paging). First request uses an offset of 0.
   * It takes the number of images returned as an argument.
   */
  private _getIncomingLinks(offset: number): void {
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

  /**
   * creates a collection of [[StillImageRepresentation]] belonging to the given resource and assigns it to it.
   * each [[StillImageRepresentation]] represents an image including regions.
   *
   * @param resource The resource to get the images for.
   * @returns A collection of images for the given resource.
   */
  private _collectRepresentationsAndAnnotations(resource: DspResource): FileRepresentation[] {
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
          annotation.resProps = Common.initProps(incomingRegion).filter(v => v.values.length > 0);

          // gather system property information
          annotation.systemProps = incomingRegion.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

          this._actions$
            .pipe(ofActionSuccessful(GetAttachedUserAction))
            .pipe(take(1))
            .subscribe(() => {
              annotations.push(annotation);
              this._cdr.markForCheck();
            });
          this._store.dispatch(new GetAttachedUserAction(annotation.res.id, annotation.res.attachedToUser));
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
  private _getIncomingStillImageRepresentations(offset: number): void {
    // make sure that this.resource has been initialized correctly
    if (this.resource === undefined) {
      return;
    }

    if (offset < 0 || offset > this.compoundPosition.maxOffsets) {
      this._notification.openSnackBar(`Offset of ${offset} is invalid`);
      return;
    }

    this._incomingService
      .getStillImageRepresentationsForCompoundResource(this.resource.res.id, offset)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((incomingImageRepresentations: ReadResourceSequence) => {
        if (!this.resource) {
          return; // if there is no resource anymore when the response arrives, do nothing
        }
        if (incomingImageRepresentations.resources.length > 0) {
          // set the incoming representations for the current offset only
          this.resource.incomingRepresentations = incomingImageRepresentations.resources;
          this._getIncomingResource(this.resource.incomingRepresentations[this.compoundPosition.position].id);
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
  private _requestIncomingResources(resource: DspResource): void {
    // make sure that this resource has been initialized correctly
    if (resource === undefined) {
      return;
    }

    // request incoming regions --> TODO: add case to get incoming sequences in case of video and audio
    if (resource.res.properties[Constants.HasStillImageFileValue]) {
      // --> TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
      // the resource is a StillImageRepresentation, check if there are regions pointing to it

      this._getIncomingRegions(resource, 0);
    } else if (this.compoundPosition) {
      // this resource is not a StillImageRepresentation
      // check if there are StillImageRepresentations pointing to this resource

      // this gets the first page of incoming StillImageRepresentations
      // more pages may be requested by [[this.viewer]].
      this._getIncomingStillImageRepresentations(this.compoundPosition.offset);
    }

    // check for incoming links for the current resource
    this._getIncomingLinks(0);
  }

  private _getIncomingRegions(resource: DspResource, offset: number): void {
    this._incomingService
      .getIncomingRegions(resource.res.id, offset)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((regions: ReadResourceSequence) => {
        // append elements of regions.resources to resource.incoming
        Array.prototype.push.apply(resource.incomingAnnotations, regions.resources);

        // this.annotationResources.push(regions.resources)

        // prepare regions to be displayed
        // triggers ngOnChanges of StillImageComponent
        this.representationsToDisplay = this._collectRepresentationsAndAnnotations(resource);
        this._cdr.detectChanges();
      });
  }

  private _initResource(iri) {
    this.oldResourceIri = this.resourceIri;
    this._getResource(iri)
      .pipe(switchMap(() => this._store.select(ResourceSelectors.resource)))
      .pipe(take(1))
      .subscribe(dspResource => this._renderResource(dspResource));
  }

  private _getResource(iri: string): Observable<DspResource> {
    return this._store.dispatch(new LoadResourceAction(iri));
  }

  private _renderResource(resource: DspResource) {
    if (resource.res.isDeleted) {
      // guard; not yet implemented
      return;
    }
    if (resource.isRegion) {
      // render the image onto which the region is pointing; a region
      // itself can not be displayed without an image it is annotating
      this._renderAsRegion(resource);
    } else {
      this._renderAsMainResource(resource);
    }

    this._cdr.markForCheck();
  }

  private _renderAsMainResource(resource: DspResource) {
    this.resource = resource;
    this.oldResourceIri = this.resourceIri;

    this.representationsToDisplay = this._collectRepresentationsAndAnnotations(resource);
    if (!this.representationsToDisplay.length && !this.compoundPosition) {
      this._incomingService
        .getStillImageRepresentationsForCompoundResource(resource.res.id, 0, true)
        .pipe(
          takeUntil(this.ngUnsubscribe),
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
      this._requestIncomingResources(resource);
    }
  }

  private _renderAsRegion(region: DspResource) {
    // display the corresponding still-image resource instance
    // find the iri of the parent resource; still-image in case of region, moving-image or audio in case of sequence
    const annotatedRepresentationIri = (region.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
      .linkedResourceIri;
    // get the annotated main resource
    this._getResource(annotatedRepresentationIri).subscribe(dspResource => {
      this.resource = dspResource;
      this._renderAsMainResource(dspResource);

      // open annotation`s tab and highlight region
      this.selectedTabLabel = 'annotations';
      this.openRegion(region.res.id);

      this.selectedRegion = region.res.id;
    });
  }

  private _getIncomingResource(iri: string) {
    this._dspApiConnection.v2.res
      .getResource(iri)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: ReadResource) => {
        this.incomingResource = new DspResource(response);
        this.incomingResource.resProps = Common.initProps(response)
          .filter(v => v.values.length > 0)
          .filter(v => v.propDef.id !== 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue');
        this.incomingResource.systemProps =
          this.incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

        this.representationsToDisplay = this._collectRepresentationsAndAnnotations(this.incomingResource);
        if (
          this.representationsToDisplay.length &&
          this.representationsToDisplay[0].fileValue &&
          this.compoundPosition
        ) {
          this._getIncomingRegions(this.incomingResource, 0);
        }

        this._cdr.markForCheck();
      });
  }
}
