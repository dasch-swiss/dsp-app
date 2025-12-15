import { AsyncPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input, OnInit } from '@angular/core';
import { KnoraApiConnection, ReadResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe } from '@ngx-translate/core';
import { expand, map, Observable, of, reduce, takeWhile } from 'rxjs';
import { PropertyRowComponent } from '../resource-properties/property-row.component';
import { sortByKeys } from '../resource-properties/sortByKeys';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { IncomingResourcePagerComponent } from './incoming-resource-pager.component';
import { IncomingStandoffLinkValueComponent } from './incoming-standoff-link-value.component';

@Component({
  selector: 'app-incoming-links-property',
  template: `
    @if (incomingLinks$ | async; as links) {
      <app-property-row
        [tooltip]="'resourceEditor.propertiesDisplay.incomingLinkTooltip' | translate"
        [label]="'resourceEditor.propertiesDisplay.incomingLinkLabel' | translate"
        [borderBottom]="true"
        [isEmptyRow]="links.length === 0">
        @if (links.length > 0) {
          <app-incoming-standoff-link-value
            [links]="links | slice: pageIndex * pageSize : (pageIndex + 1) * pageSize" />
          @if (links.length > pageSize) {
            <app-incoming-resource-pager
              [pageIndex]="pageIndex"
              [pageSize]="pageSize"
              [itemsNumber]="links.length"
              (pageChanged)="pageChanged($event)" />
          }
        }
      </app-property-row>
    } @else {
      <app-property-row
        [tooltip]="'resourceEditor.propertiesDisplay.incomingLinkTooltip' | translate"
        [label]="'resourceEditor.propertiesDisplay.incomingLinkLabel' | translate"
        [borderBottom]="true"
        [isEmptyRow]="true">
        <app-progress-indicator />
      </app-property-row>
    }
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    SlicePipe,
    TranslatePipe,
    PropertyRowComponent,
    IncomingStandoffLinkValueComponent,
    IncomingResourcePagerComponent,
    AppProgressIndicatorComponent,
  ],
})
export class IncomingLinksPropertyComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;

  incomingLinks$!: Observable<IncomingOrStandoffLink[]>;
  pageSize = 25;
  pageIndex = 0;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApi: KnoraApiConnection
  ) {}

  ngOnInit() {
    this.incomingLinks$ = this._getIncomingLinksRecursively$(this.resource.id);
  }

  pageChanged(page: number) {
    this.pageIndex = page;
  }

  private _getIncomingLinksRecursively$(resourceId: string) {
    let offset = 0;

    return this._dspApi.v2.search.doSearchIncomingLinks(resourceId, offset).pipe(
      expand(sequence => {
        if (!sequence.mayHaveMoreResults) {
          return of(sequence);
        }
        offset += 1;
        return this._dspApi.v2.search.doSearchIncomingLinks(resourceId, offset) as Observable<ReadResourceSequence>;
      }),
      takeWhile(response => response.resources.length > 0 && response.mayHaveMoreResults, true),
      reduce((all: ReadResource[], data) => all.concat(data.resources), []),
      map(incomingResources => {
        const incomingLinks = incomingResources.map(resource =>
          IncomingLinksPropertyComponent.createIncomingOrStandoffLink(resource)
        );
        return sortByKeys(incomingLinks, ['project', 'label']);
      })
    );
  }

  static createIncomingOrStandoffLink(resource: ReadResource): IncomingOrStandoffLink {
    const resourceIdPathOnly = resource.id.match(/[^\/]*\/[^\/]*$/);
    if (!resourceIdPathOnly) {
      throw new AppError('Resource id is not in the expected format');
    }

    return {
      label: resource.label,
      uri: `/resource/${resourceIdPathOnly[0]}`,
      iri: resource.id,
      project: resource.resourceClassLabel ? resource.resourceClassLabel : '',
    };
  }
}
