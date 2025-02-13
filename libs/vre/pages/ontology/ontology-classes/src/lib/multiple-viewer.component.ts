import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FilteredResources, SearchParams } from '@dasch-swiss/vre/shared/app-common-to-move';
import { SplitSize } from './split-size.interface';

@Component({
  selector: 'app-multiple-viewer',
  template: `
    <div class="multiple-instances">
      <as-split direction="horizontal" (dragEnd)="splitSizeChanged = $event">
        <as-split-area [size]="40">
          <app-list-view
            [search]="searchParams"
            [withMultipleSelection]="true"
            (selectedResources)="openSelectedResources($event)" />
        </as-split-area>
        <as-split-area [size]="60" *ngIf="selectedResources?.count > 0" cdkScrollable>
          <div [ngSwitch]="viewMode">
            <!-- single resource view -->
            <app-resource-fetcher *ngSwitchCase="'single'" [resourceIri]="selectedResources.resInfo[0].id" />

            <!-- intermediate view -->
            <app-intermediate
              *ngSwitchCase="'intermediate'"
              [resources]="selectedResources"
              (action)="viewMode = $event" />

            <!-- multiple resources view / comparison viewer -->
            <app-comparison
              *ngSwitchCase="'compare'"
              [resources]="selectedResources?.resInfo"
              [splitSizeChanged]="splitSizeChanged" />
          </div>
        </as-split-area>
      </as-split>
    </div>
  `,
  styleUrls: ['./multiple-viewer.component.scss'],
})
export class MultipleViewerComponent {
  @Input({ required: true }) searchParams!: SearchParams;
  viewMode: 'single' | 'intermediate' | 'compare' = 'single';
  selectedResources: FilteredResources | undefined = undefined;
  splitSizeChanged: SplitSize | undefined = undefined;

  constructor(private _cdr: ChangeDetectorRef) {}

  openSelectedResources(res: FilteredResources) {
    this.selectedResources = { ...res, resInfo: [...res.resInfo] };

    if (!res || res.count <= 1) {
      this.viewMode = 'single';
    } else if (this.viewMode !== 'compare') {
      this.viewMode = res.count > 0 ? 'intermediate' : 'single';
    }
    this._cdr.detectChanges();
  }
}
