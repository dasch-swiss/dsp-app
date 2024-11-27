import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspCompoundPosition, DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppError } from '@dasch-swiss/vre/shared/app-error-handler';
import { GetAttachedProjectAction, GetAttachedUserAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';

/**
 * Service to handle compound resources, which are resources that are composed of multiple resources.
 */
@Injectable()
export class CompoundService {
  compoundPosition!: DspCompoundPosition;

  private _incomingResource = new BehaviorSubject<DspResource | undefined>(undefined);
  incomingResource$ = this._incomingResource.asObservable();

  private _resource!: DspResource;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _incomingService: IncomingService,
    private _regionService: RegionService,
    private _cd: ChangeDetectorRef,
    private _store: Store
  ) {}

  onInit(_compound: DspCompoundPosition, resource: DspResource) {
    this.compoundPosition = _compound;
    this._resource = resource;
    this.openPage(_compound.page);
  }

  openPage(page: number) {
    this.compoundPosition.page = page;
    this._loadIncomingResourcesPage();
  }

  private _loadIncomingResourcesPage(): void {
    this._incomingService
      .getStillImageRepresentationsForCompoundResource(this._resource.res.id, this.compoundPosition.offset)
      .subscribe(res => {
        const incomingImageRepresentations = res as ReadResourceSequence;

        if (incomingImageRepresentations.resources.length === 0) {
          this._incomingResource.next(undefined);
          return;
        }
        this._resource.incomingRepresentations = incomingImageRepresentations.resources;
        this._loadIncomingResource(this._resource.incomingRepresentations[this.compoundPosition.position].id);
      });
  }

  private _loadIncomingResource(iri: string) {
    this._dspApiConnection.v2.res.getResource(iri).subscribe(res => {
      const response = res as ReadResource;

      const incomingResource = new DspResource(response);
      incomingResource.resProps = GenerateProperty.incomingRessourceProperty(response);
      incomingResource.systemProps =
        incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

      this._store.dispatch([
        new GetAttachedUserAction(incomingResource.res.id, incomingResource.res.attachedToUser),
        new GetAttachedProjectAction(incomingResource.res.id, incomingResource.res.attachedToProject),
      ]);
      this._reloadViewer(incomingResource);
      this._regionService.initialize(incomingResource.res.id);
    });
  }

  private _reloadViewer(resource: DspResource) {
    this._incomingResource.next(resource);
    this._cd.detectChanges();
  }
}
