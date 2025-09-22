import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponseError, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject, takeUntil } from 'rxjs';

type HideReason = 'NotFound' | 'Deleted' | 'Unauthorized' | null;

@Component({
  selector: 'app-resource-fetcher',
  template: `
    <div #scrollTarget>
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
    </div>
  `,
  providers: [ResourceFetcherService],
})
export class ResourceFetcherComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) resourceIri!: string;
  @Output() afterResourceDeleted = new EventEmitter<ReadResource>();
  @ViewChild('scrollTarget') scrollTarget!: ElementRef;

  resource?: DspResource;
  hideStatus: HideReason = null;

  private _destroy$ = new Subject<void>();

  get resourceVersion() {
    return this._route.snapshot.queryParamMap.get('version') || undefined;
  }

  constructor(
    private _resourceFetcherService: ResourceFetcherService,
    private _notification: NotificationService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _translateService: TranslateService
  ) {}

  ngOnInit() {
    if (this.resourceVersion && !ResourceUtil.versionIsValid(this.resourceVersion)) {
      this._translateService.get('resourceEditor.versionNotValid').subscribe(v => {
        this._notification.openSnackBar(v);
      });
    }

    this._resourceFetcherService.resource$
      .pipe(
        filter(resource => !!resource),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: resource => {
          if (resource?.res.type === Constants.DeletedResource) {
            this.hideStatus = 'Deleted';
            this.resource = resource;
            this.afterResourceDeleted.emit(resource.res);
            return;
          }

          this.hideStatus = null;
          this.resource = resource;

          const normalizeToCompactFormat = (isoDate: string): string => {
            return isoDate.replace(/[-:.]/g, '');
          };

          const hasResourceVersionOfLatestVersion =
            (!!this.resourceVersion &&
              this.resourceVersion === normalizeToCompactFormat(resource?.res.lastModificationDate || '')) ||
            (!!this.resourceVersion && !resource?.res.lastModificationDate);

          if (hasResourceVersionOfLatestVersion) {
            this._purgeVersionParam();
          }
        },
        error: err => {
          if (err instanceof ApiResponseError && err.status === 404) {
            this.hideStatus = 'NotFound';
            return;
          }

          if (err instanceof ApiResponseError && err.status === 403) {
            this.hideStatus = 'Unauthorized';
            return;
          }

          throw err;
        },
      });

    this._resourceFetcherService.scrollToTop$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.scrollTarget?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  ngOnChanges() {
    this.hideStatus = null;
    this.resource = undefined;
    this._resourceFetcherService.loadResource(this.resourceIri, this.resourceVersion);
  }

  navigateToCurrentVersion() {
    this._purgeVersionParam();
    this._resourceFetcherService.loadResource(this.resourceIri);
  }

  private _purgeVersionParam() {
    this._router.navigate([], {
      queryParams: { version: null },
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
