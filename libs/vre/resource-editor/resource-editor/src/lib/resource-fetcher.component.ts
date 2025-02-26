import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-resource-fetcher',
  template: ' <app-resource *ngIf="resource" [resource]="resource" />',
  providers: [ResourceFetcherService],
})
export class ResourceFetcherComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) resourceIri!: string;

  resource?: DspResource;

  private _subscription?: Subscription;

  constructor(
    private _cdr: ChangeDetectorRef,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges() {
    this._resourceFetcherService.onDestroy();
    this._resourceFetcherService.onInit(this.resourceIri);

    if (this._subscription) {
      this._subscription.unsubscribe();
    }

    this._subscription = this._resourceFetcherService.resource$.subscribe(resource => {
      if (resource === null) {
        return;
      }

      if (resource.res.isDeleted) {
        return;
      }

      this._reloadEditor(resource);
    });
  }

  private _reloadEditor(resource: DspResource) {
    this.resource = resource;
    this._cdr.detectChanges();
  }

  ngOnDestroy() {
    this._resourceFetcherService.onDestroy();
  }
}
