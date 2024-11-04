import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspCompoundPosition, DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppError } from '@dasch-swiss/vre/shared/app-error-handler';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';

/**
 * Service to handle compound resources, which are resources that are composed of multiple resources.
 */
@Injectable()
export class CompoundService {
  compoundPosition?: DspCompoundPosition;
  incomingResource?: DspResource;

  private _resource!: DspResource;

  get exists() {
    return this.compoundPosition !== undefined;
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _incomingService: IncomingService,
    private _regionService: RegionService,
    private _cd: ChangeDetectorRef
  ) {}

  onInit(_compound: DspCompoundPosition, resource: DspResource) {
    this.compoundPosition = _compound;
    this._resource = resource;
    this.openPage(_compound.page);
  }

  openPage(page: number) {
    if (!this.compoundPosition) {
      throw new AppError('Compound position is not set');
    }

    const offset = Math.ceil(page / 25) - 1;
    const position = Math.floor(page - offset * 25 - 1);

    if (offset === this.compoundPosition.offset && this._resource.incomingRepresentations.length > 0) {
      if (this._resource.incomingRepresentations[position]) {
        this._loadIncomingResource(this._resource.incomingRepresentations[position].id);
      }
    } else {
      this.compoundPosition.offset = offset;
      this._loadIncomingResourcesPage(this.compoundPosition, offset);
    }

    this.compoundPosition.position = position;
    this.compoundPosition.page = page;
  }

  private _loadIncomingResourcesPage(compoundPosition: DspCompoundPosition, offset: number): void {
    if (offset < 0 || offset > compoundPosition.maxOffsets) {
      throw new AppError(`Offset of ${offset} is invalid`);
    }

    this._incomingService
      .getStillImageRepresentationsForCompoundResource(this._resource.res.id, offset)
      .subscribe(res => {
        const incomingImageRepresentations = res as ReadResourceSequence;

        if (incomingImageRepresentations.resources.length === 0) {
          return;
        }
        this._resource.incomingRepresentations = incomingImageRepresentations.resources;
        this._loadIncomingResource(this._resource.incomingRepresentations[compoundPosition.position].id);
      });
  }

  private _loadIncomingResource(iri: string) {
    this._dspApiConnection.v2.res.getResource(iri).subscribe(res => {
      const response = res as ReadResource;

      const incomingResource = new DspResource(response);
      incomingResource.resProps = GenerateProperty.incomingRessourceProperty(response);
      incomingResource.systemProps =
        incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

      this._reloadViewer(incomingResource);
      this._regionService.onInit(incomingResource);
    });
  }

  private _reloadViewer(resource: DspResource) {
    this.incomingResource = undefined;
    this._cd.detectChanges();
    this.incomingResource = resource;
    this._cd.detectChanges();
  }
}
