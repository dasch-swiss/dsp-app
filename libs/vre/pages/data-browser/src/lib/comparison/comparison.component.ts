import { Component, Input, OnChanges, Optional } from '@angular/core';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';

@Component({
  selector: 'app-comparison',
  template: ` <as-split direction="vertical">
      <as-split-area>
        <!-- note: This part is repeating twice (not added as component) because angular-split
          library does not support addition div inside as-split -->
        <as-split direction="horizontal">
          @for (res of topRow; track res) {
            <as-split-area>
              <ng-container *ngTemplateOutlet="resourceTemplate; context: { res: res }" />
            </as-split-area>
          }
        </as-split>
      </as-split-area>
      @if (resourcesNumber > 3) {
        <as-split-area>
          <as-split direction="horizontal">
            @for (res of bottomRow; track res) {
              <as-split-area>
                <ng-container *ngTemplateOutlet="resourceTemplate; context: { res: res }" />
              </as-split-area>
            }
          </as-split>
        </as-split-area>
      }
    </as-split>

    <ng-template #resourceTemplate let-res="res">
      <div style="max-width: 960px; margin: auto; margin-top: 32px; margin-bottom: 32px; padding: 0 16px">
        <app-resource-fetcher [resourceIri]="res" (afterResourceDeleted)="updateResourceCount()" />
      </div>
    </ng-template>`,
  standalone: false,
})
export class ComparisonComponent implements OnChanges {
  @Input({ required: true }) resourceIds!: string[];

  topRow: string[] = [];
  bottomRow: string[] = [];

  get resourcesNumber() {
    return this.resourceIds.length;
  }

  constructor(@Optional() private _projectPageService: ProjectPageService) {}

  ngOnChanges(): void {
    const resourceIds = this.resourceIds;

    if (this.resourcesNumber < 4) {
      this.topRow = resourceIds;
    } else {
      this.topRow = resourceIds.slice(0, this.resourcesNumber / 2);
      this.bottomRow = resourceIds.slice(this.resourcesNumber / 2);
    }
  }

  updateResourceCount() {
    this._projectPageService?.reloadProject();
  }
}
