import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspCompoundPosition, DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';

@Injectable()
export class CompoundService {
  compoundPosition!: DspCompoundPosition;
  incomingResource: DspResource | undefined;
  private _resource!: DspResource;

  get exists() {
    return this.compoundPosition !== undefined;
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _incomingService: IncomingService,
    private _notification: NotificationService,
    private _regionService: RegionService,
    private _cd: ChangeDetectorRef
  ) {}

  onInit(_compound: DspCompoundPosition, resource: DspResource) {
    this.compoundPosition = _compound;
    this._resource = resource;
    this.openPage(_compound.page);
  }

  openPage(page: number) {
    const offset = Math.ceil(page / 25) - 1;
    const position = Math.floor(page - offset * 25 - 1);

    // get incoming still image representations, if the offset changed
    if (offset === this.compoundPosition.offset && this._resource.incomingRepresentations.length > 0) {
      // get incoming resource, if the offset is the same but page changed
      this._loadIncomingResource(this._resource.incomingRepresentations[position].id);
    } else {
      this.compoundPosition.offset = offset;
      this._loadIncomingResourcesPage(offset);
    }

    this.compoundPosition.position = position;
    this.compoundPosition.page = page;
  }

  private _loadIncomingResourcesPage(offset: number): void {
    if (offset < 0 || offset > this.compoundPosition.maxOffsets) {
      this._notification.openSnackBar(`Offset of ${offset} is invalid`);
      return;
    }

    this._incomingService
      .getStillImageRepresentationsForCompoundResource(this._resource.res.id, offset)
      .subscribe(res => {
        const incomingImageRepresentations = res as ReadResourceSequence;

        if (incomingImageRepresentations.resources.length === 0) {
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

      this.incomingResource = incomingResource;
      this._regionService.onInit(incomingResource);
      this._cd.markForCheck();
    });
  }
}
