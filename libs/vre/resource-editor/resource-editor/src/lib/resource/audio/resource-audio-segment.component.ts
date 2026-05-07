import { AsyncPipe } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { KnoraApiConnection, ReadIntervalValue, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { map, Observable, of } from 'rxjs';
import { AudioComponent } from './audio.component';
import { getFileValue } from '../../representation/get-file-value';
import { ResourceDefaultTabsComponent } from '../../properties/resource-default-tabs.component';
import { ResourceHeaderComponent } from '../../header/resource-header.component';
import { ResourceLegalComponent } from '../../representation/resource-legal.component';
import { PropertiesDisplayService } from '../../properties/properties-display/property-value/properties-display.service';
import { ResourceRepresentationContainerComponent } from '../../representation/resource-representation-container.component';
import { ResourceRestrictionComponent } from '../../meta/resource-restriction.component';
import { Segment } from '../../representation/segments/segment';
import { SegmentsService } from '../../representation/segments/segments.service';

const IS_AUDIO_SEGMENT_OF_VALUE = 'http://api.knora.org/ontology/knora-api/v2#isAudioSegmentOfValue';
const HAS_SEGMENT_BOUNDS = 'http://api.knora.org/ontology/knora-api/v2#hasSegmentBounds';

@Component({
  selector: 'app-resource-audio-segment',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    @if (parentResource$ | async; as parentResource) {
      <app-resource-legal [fileValue]="getFileValue(parentResource)" />
      <app-resource-representation-container height="small">
        <app-audio
          [src]="getFileValue(parentResource)"
          [parentResource]="parentResource"
          [start]="start"
          [overrideSegments]="currentSegments" />
      </app-resource-representation-container>
    }
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService, SegmentsService],
  imports: [
    AsyncPipe,
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    AudioComponent,
    ResourceRepresentationContainerComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceAudioSegmentComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  parentResource$!: Observable<ReadResource>;
  start = 0;
  currentSegments: Segment[] = [];

  constructor(@Inject(DspApiConnectionToken) private readonly _dspApi: KnoraApiConnection) {}

  ngOnInit() {
    const linkValue = this.resource.res.properties[IS_AUDIO_SEGMENT_OF_VALUE]?.[0] as ReadLinkValue | undefined;
    if (!linkValue) {
      this.parentResource$ = of();
      return;
    }
    const bounds = this.resource.res.properties[HAS_SEGMENT_BOUNDS]?.[0] as ReadIntervalValue | undefined;
    if (bounds?.start != null) {
      this.start = bounds.start;
    }
    if (bounds) {
      this.currentSegments = [
        {
          resource: this.resource,
          row: 0,
          label: this.resource.res.label,
          hasSegmentBounds: bounds,
          hasSegmentOfValue: linkValue,
          hasComment: undefined,
          hasDescription: undefined,
          hasKeyword: undefined,
          hasTitle: undefined,
        },
      ];
    }
    this.parentResource$ = this._dspApi.v2.res
      .getResource(linkValue.linkedResourceIri)
      .pipe(map(r => r as ReadResource));
  }

  getFileValue(resource: ReadResource) {
    return getFileValue(resource)!;
  }
}
