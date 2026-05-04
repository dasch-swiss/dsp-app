import { AsyncPipe } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { Constants, KnoraApiConnection, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { map, Observable, of } from 'rxjs';
import { RegionService } from './representations/region.service';
import { StillImageComponent } from './representations/still-image/still-image.component';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';

@Component({
  selector: 'app-resource-annotation',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-representation-container>
      @if (imageResource$ | async; as imageResource) {
        <app-still-image [resource]="imageResource" [compoundMode]="false" />
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
    StillImageComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceAnnotationComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  imageResource$!: Observable<ReadResource>;

  constructor(
    private readonly _regionService: RegionService,
    @Inject(DspApiConnectionToken) private readonly _dspApi: KnoraApiConnection
  ) {}

  ngOnInit() {
    this._regionService.initializeWithRegions([this.resource]);
    this.imageResource$ = this._loadImageResource();
  }

  private _loadImageResource(): Observable<ReadResource> {
    const linkValues = this.resource.res.properties[Constants.IsRegionOfValue];
    if (!linkValues?.length) return of();
    const imageIri = (linkValues[0] as ReadLinkValue).linkedResourceIri;
    return this._dspApi.v2.res.getResource(imageIri).pipe(map(r => r as ReadResource));
  }
}
