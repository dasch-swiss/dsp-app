import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { Common, DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';
import { IncomingService } from '@dasch-swiss/vre/shared/app-resource-properties';

@Injectable()
export class CompoundService {
  compoundPosition!: DspCompoundPosition;
  incomingResource: DspResource | undefined;
  private _resource!: DspResource;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _incomingService: IncomingService,
    private _notification: NotificationService,
    private _regionService: RegionService
  ) {}

  onInit(_compound: DspCompoundPosition, resource: DspResource) {
    this.compoundPosition = _compound;
    this._resource = resource;
    this.openPage(1);
  }

  openPage(page: number) {
    const offset = Math.ceil(page / 25) - 1;
    const position = Math.floor(page - offset * 25 - 1);

    // get incoming still image representations, if the offset changed
    if (offset !== this.compoundPosition.offset) {
      this.compoundPosition.offset = offset;
      this._loadIncomingResourcesPage(offset);
    } else {
      // get incoming resource, if the offset is the same but page changed
      this._loadIncomingResource(this._resource.incomingRepresentations[position].id);
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
      incomingResource.resProps = Common.initProps(response)
        .filter(v => v.values.length > 0)
        .filter(v => v.propDef.id !== 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue');
      incomingResource.systemProps =
        incomingResource.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

      this.incomingResource = incomingResource;
      this._regionService.onInit(incomingResource);
    });
  }
}
