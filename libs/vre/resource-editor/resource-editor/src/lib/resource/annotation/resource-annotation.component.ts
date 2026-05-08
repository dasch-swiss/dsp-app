import { AsyncPipe } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { Constants, KnoraApiConnection, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { EMPTY, map, Observable } from 'rxjs';
import { ResourceHeaderComponent } from '../../header/resource-header.component';
import { ResourceRestrictionComponent } from '../../meta/resource-restriction.component';
import { PropertiesDisplayService } from '../../properties/properties-display/property-value/properties-display.service';
import { ResourceDefaultTabsComponent } from '../../properties/resource-default-tabs.component';
import { RegionService } from '../../representation/region.service';
import { RepresentationErrorMessageComponent } from '../../representation/representation-error-message.component';
import { ResourceRepresentationContainerComponent } from '../../representation/resource-representation-container.component';
import { StillImageComponent } from '../still-image/still-image.component';

@Component({
  selector: 'app-resource-annotation',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-representation-container>
      @if (missingImageLink) {
        <app-representation-error-message />
      } @else if (imageResource$ | async; as imageResource) {
        <app-still-image [resource]="imageResource" [compoundMode]="false" [showLeftToolbar]="false" />
      }
    </app-resource-representation-container>
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService, RegionService],
  imports: [
    AsyncPipe,
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceRepresentationContainerComponent,
    RepresentationErrorMessageComponent,
    StillImageComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceAnnotationComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  imageResource$!: Observable<ReadResource>;
  missingImageLink = false;

  constructor(
    private readonly _regionService: RegionService,
    @Inject(DspApiConnectionToken) private readonly _dspApi: KnoraApiConnection
  ) {}

  ngOnInit() {
    this._regionService.initializeWithRegions([this.resource]);
    this._regionService.selectRegion(this.resource.res.id);
    this.imageResource$ = this._loadImageResource();
  }

  private _loadImageResource(): Observable<ReadResource> {
    const linkValues = this.resource.res.properties[Constants.IsRegionOfValue];
    if (!linkValues?.length) {
      console.warn(`ResourceAnnotationComponent: no IsRegionOfValue found on annotation ${this.resource.res.id}`);
      this.missingImageLink = true;
      return EMPTY;
    }
    const imageIri = (linkValues[0] as ReadLinkValue).linkedResourceIri;
    return this._dspApi.v2.res.getResource(imageIri).pipe(map(r => r as ReadResource));
  }
}
