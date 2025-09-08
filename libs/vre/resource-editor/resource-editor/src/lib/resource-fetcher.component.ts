import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponseError, ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

type HideReason = 'NotFound' | 'Deleted' | 'Unauthorized' | null;

@Component({
  selector: 'app-resource-fetcher',
  template: `
    @if (resourceVersion) {
      <app-resource-version-warning
        [resourceVersion]="resourceVersion"
        (navigateToCurrentVersion)="navigateToCurrentVersion()" />
    }

    @if (!hideStatus) {
      @if (resource) {
        <app-resource [resource]="resource" />
      } @else {
        <app-progress-indicator />
      }
    } @else {
      <div style="display: flex; justify-content: center; padding: 16px">
        @if (hideStatus === 'NotFound') {
          <h3>{{ 'resourceEditor.notFound' | translate }}</h3>
        }
        @if (hideStatus === 'Unauthorized') {
          <h3>{{ 'resourceEditor.unauthorized' | translate }}</h3>
        }
        @if (hideStatus === 'Deleted') {
          <div style="text-align: center">
            <h3>{{ 'resourceEditor.deleted' | translate }}</h3>
            @if (resource?.res.deleteComment; as comment) {
              <h4>"{{ comment }}"</h4>
            }
          </div>
        }
      </div>
    }
  `,
  providers: [ResourceFetcherService],
})
export class ResourceFetcherComponent implements OnChanges {
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
    private _translateService: TranslateService
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
          if (resource.res.type === 'http://api.knora.org/ontology/knora-api/v2#DeletedResource') {
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

  private _reloadIfCurrentVersion(resourceVersion: string, lastModificationDate?: string) {
    if (lastModificationDate === undefined || resourceVersion === lastModificationDate) {
      this.navigateToCurrentVersion();
    }
  }
}
