import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ApiResponseError, ReadResource } from '@dasch-swiss/dsp-js';
import { SetCurrentResourceAction } from '@dasch-swiss/vre/core/state';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';

type HideReason = 'NotFound' | 'Deleted' | null;

@Component({
  selector: 'app-resource-fetcher',
  template: `
    <ng-container *ngIf="!hideStatus; else hideTpl">
      <app-resource *ngIf="resource; else loadingTpl" [resource]="resource" />
    </ng-container>

    <ng-template #hideTpl>
      <div style="display: flex; justify-content: center; padding: 16px">
        <h3 *ngIf="hideStatus === 'NotFound'">This resource is not found.</h3>

        <div *ngIf="hideStatus === 'Deleted'" style="text-align: center">
          <h3>This resource has been deleted.</h3>
          <h4 *ngIf="resource?.res.deleteComment as comment">Reason: {{ comment }}</h4>
        </div>
      </div>
    </ng-template>

    <ng-template #loadingTpl>
      <app-progress-indicator />
    </ng-template>
  `,
  providers: [ResourceFetcherService],
})
export class ResourceFetcherComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) resourceIri!: string;
  @Output() afterResourceDeleted = new EventEmitter<ReadResource>();

  resource?: DspResource;
  hideStatus: HideReason = null;

  subscription!: Subscription;

  constructor(
    private _resourceFetcherService: ResourceFetcherService,
    private _store: Store
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resourceIri']) {
      this.hideStatus = null;
      this.resource = undefined;
      this._resourceFetcherService.onInit(this.resourceIri);

      this.subscription?.unsubscribe();
      this.subscription = this._resourceFetcherService.resource$.subscribe(
        resource => {
          if (resource.res.isDeleted) {
            this.hideStatus = 'Deleted';
            this.resource = resource;
            this.afterResourceDeleted.emit(resource.res);
            return;
          }

          this.hideStatus = null;
          this.resource = resource;
        },
        err => {
          if (err instanceof ApiResponseError && err.status === 404) {
            this.hideStatus = 'NotFound';
          }
        }
      );
    }
  }

  ngOnDestroy() {
    this._store.dispatch(new SetCurrentResourceAction(null));
  }
}
