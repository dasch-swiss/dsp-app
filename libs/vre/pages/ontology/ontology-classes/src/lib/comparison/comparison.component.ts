import { Component, Input, OnChanges } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { LoadResourceClassItemsCountAction } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { ShortResInfo } from '../list-view/list-view.component';
import { SplitSize } from '../split-size.interface';

@Component({
  selector: 'app-comparison',
  template: `
    <div class="content">
      <as-split direction="vertical">
        <as-split-area>
          <!-- note: This part is repeating twice (not added as component) because angular-split
                                                                                                                          library does not support addition div inside as-split -->
          <as-split direction="horizontal" (dragEnd)="splitSizeChanged = $event">
            <as-split-area *ngFor="let res of topRow">
              <app-resource-fetcher [resourceIri]="res" (afterResourceDeleted)="updateResourceCount($event)" />
            </as-split-area>
          </as-split>
        </as-split-area>
        <as-split-area *ngIf="resourcesNumber > 3">
          <as-split direction="horizontal" (dragEnd)="splitSizeChanged = $event">
            <as-split-area *ngFor="let res of bottomRow">
              <app-resource-fetcher [resourceIri]="res" (afterResourceDeleted)="updateResourceCount($event)" />
            </as-split-area>
          </as-split>
        </as-split-area>
      </as-split>
    </div>
  `,
  styles: [
    `
      .content {
        width: 100%;
        height: 1400px;
      }
    `,
  ],
})
export class ComparisonComponent implements OnChanges {
  @Input() resources?: ShortResInfo[];

  // parent (or own) split size changed
  @Input() splitSizeChanged: SplitSize;

  topRow: string[] = [];
  bottomRow: string[] = [];

  get resourcesNumber() {
    return this.resources.length;
  }

  constructor(private _store: Store) {}

  ngOnChanges(): void {
    const resourceIds = this.resources.map(res => res.id);

    if (this.resourcesNumber < 4) {
      this.topRow = resourceIds;
    } else {
      this.topRow = resourceIds.slice(0, this.resourcesNumber / 2);
      this.bottomRow = resourceIds.slice(this.resourcesNumber / 2);
    }
  }

  updateResourceCount(resource: ReadResource) {
    this._store.dispatch(new LoadResourceClassItemsCountAction(resource));
  }
}
