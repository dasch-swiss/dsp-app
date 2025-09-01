import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspCompoundPosition, DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject } from 'rxjs';

/**
 * Service to handle compound resources, which are resources that are composed of multiple resources.
 */
@Injectable()
export class CompoundService {
  compoundPosition?: DspCompoundPosition;

  incomingResource = new BehaviorSubject<DspResource | undefined>(undefined);
  incomingResource$ = this.incomingResource.asObservable();

  private _resource?: DspResource;

  constructor(
    private _cd: ChangeDetectorRef,
    @Inject(DspApiConnectionToken) private _dspApi: KnoraApiConnection,
    private _regionService: RegionService
  ) {}

  onInit(_compound: DspCompoundPosition, resource: DspResource) {
    this.compoundPosition = _compound;
    this._resource = resource;
    this.openPage(_compound.page);
  }

  reset() {
    this.compoundPosition = undefined;
    this._resource = undefined;
    this.incomingResource.next(undefined);
  }

  openPage(page: number) {
    if (!this.compoundPosition) {
      throw new AppError('Compound position is not set');
    }

    this.compoundPosition.page = page;
    this._loadIncomingResourcesPage(this.compoundPosition);
  }

  private _loadIncomingResourcesPage(compoundPosition: DspCompoundPosition): void {
    this._dspApi.v2.search
      .doSearchStillImageRepresentations(this._resource!.res.id, compoundPosition.offset)
      .subscribe(res => {
        const incomingImageRepresentations = res as ReadResourceSequence;

        if (incomingImageRepresentations.resources.length === 0) {
          this.incomingResource.next(undefined);
          return;
        }

        this._resource!.incomingRepresentations = incomingImageRepresentations.resources;
        this._loadIncomingResource(this._resource!.incomingRepresentations[compoundPosition.position].id);
      });
  }

  private _loadIncomingResource(iri: string) {
    this._dspApi.v2.res.getResource(iri).subscribe(res => {
      const response = res as ReadResource;

      const incomingResource = new DspResource(response);
      incomingResource.resProps = GenerateProperty.incomingRessourceProperty(response);
      incomingResource.systemProps =
        incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

      this._reloadViewer(incomingResource);
      this._regionService.initialize(incomingResource.res.id);
    });
  }

  private _reloadViewer(resource: DspResource) {
    this.incomingResource.next(resource);
    this._cd.detectChanges();
  }
}
