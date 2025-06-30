import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponseError, ReadResource } from '@dasch-swiss/dsp-js';
import { SetCurrentResourceAction } from '@dasch-swiss/vre/core/state';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';

type HideReason = 'NotFound' | 'Deleted' | 'Unauthorized' | null;

@Component({
  selector: 'app-resource-fetcher',
  template: `
    <div class="content large middle">
      <app-resource-version-warning
        *ngIf="resourceVersion"
        [resourceVersion]="resourceVersion"
        (navigateToCurrentVersion)="navigateToCurrentVersion()" />

      <ng-container *ngIf="!hideStatus; else hideTpl">
        <app-resource *ngIf="resource; else loadingTpl" [resource]="resource" />
      </ng-container>
    </div>

    <ng-template #hideTpl>
      <div style="display: flex; justify-content: center; padding: 16px">
        <h3 *ngIf="hideStatus === 'NotFound'">{{ 'resourceEditor.notFound' | translate }}</h3>

        <h3 *ngIf="hideStatus === 'Unauthorized'">{{ 'resourceEditor.unauthorized' | translate }}</h3>

        <div *ngIf="hideStatus === 'Deleted'" style="text-align: center">
          <h3>{{ 'resourceEditor.deleted' | translate }}</h3>
          <h4 *ngIf="resource?.res.deleteComment as comment">"{{ comment }}"</h4>
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
  @Input() resourceVersion?: string;
  @Output() afterResourceDeleted = new EventEmitter<ReadResource>();

  resource?: DspResource;
  hideStatus: HideReason = null;

  subscription!: Subscription;

  constructor(
    private _resourceFetcherService: ResourceFetcherService,
    private _notification: NotificationService,
    private _router: Router,
    private _translateService: TranslateService,
    private _store: Store
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resourceIri'] || changes['resourceVersion']) {
      this.hideStatus = null;
      this.resource = undefined;

      if (
        changes['resourceVersion']?.currentValue !== undefined &&
        !ResourceUtil.versionIsValid(changes['resourceVersion'].currentValue)
      ) {
        this.resourceVersion = undefined;
        this._translateService.get('resourceEditor.versionNotValid').subscribe(v => {
          this._notification.openSnackBar(v);
        });
      }

      this._resourceFetcherService.onInit(this.resourceIri, this.resourceVersion);

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

          if (this.resourceVersion !== undefined) {
            this._reloadIfCurrentVersion(this.resourceVersion, resource.res.lastModificationDate);
          }
        },
        err => {
          if (err instanceof ApiResponseError && err.status === 404) {
            this.hideStatus = 'NotFound';
            return;
          }

          if (err instanceof ApiResponseError && err.status === 403) {
            this.hideStatus = 'Unauthorized';
            return;
          }

          throw err;
        }
      );
    }
  }

  navigateToCurrentVersion() {
    this._router
      .navigate([], {
        queryParams: { version: null }, // Set parameter to null to remove it
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this._resourceFetcherService.reload();
      });
  }

  ngOnDestroy() {
    this._store.dispatch(new SetCurrentResourceAction(null));
  }

  private _reloadIfCurrentVersion(resourceVersion: string, lastModificationDate?: string) {
    if (lastModificationDate === undefined || resourceVersion === lastModificationDate) {
      this.navigateToCurrentVersion();
    }
  }
}
