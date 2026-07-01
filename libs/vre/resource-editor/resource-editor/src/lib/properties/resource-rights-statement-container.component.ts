import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DspResource, filterNull, PaginatedApiService, UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceLegalService } from './resource-legal.service';

interface DataRights {
  licenseLabel?: string;
  licenseUrl?: string;
  copyrightHolder?: string;
  authorship: string[];
}

/**
 * Viewer wrapper for the data-side Resource Rights Statement: resolves the project's data-side legal
 * info (license label/deed URL, holder, default authorship) and renders the per-resource statement,
 * with an inline authorship edit for users with Modify rights.
 */
@Component({
  selector: 'app-resource-rights-statement-container',
  template: `
    @if (dataRights$ | async; as rights) {
      <app-resource-rights-statement
        [licenseLabel]="rights.licenseLabel"
        [licenseUrl]="rights.licenseUrl"
        [copyrightHolder]="rights.copyrightHolder"
        [authorship]="rights.authorship"
        [resourceAuthorship]="resource.res.resourceAuthorship"
        [isAdmin]="(userHasProjectAdminRights$ | async) === true"
        [canEditAuthorship]="canEditAuthorship"
        (saveAuthorship)="onSaveAuthorship($event)"
        (editLegalInfo)="onEditLegalInfo()" />
    }
  `,
  imports: [AsyncPipe, ResourceRightsStatementComponent],
})
export class ResourceRightsStatementContainerComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  dataRights$!: Observable<DataRights>;
  /** Whether the current user may configure the project's legal info (controls the unconfigured callout). */
  userHasProjectAdminRights$!: Observable<boolean>;

  // TODO(verify-locally): confirm userHasPermission codes that imply Modify rights.
  get canEditAuthorship(): boolean {
    return ['M', 'D', 'CR'].includes(this.resource.res.userHasPermission);
  }

  constructor(
    private readonly _destroyRef: DestroyRef,
    private readonly _notification: NotificationService,
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectApi: ProjectApiService,
    private readonly _resourceFetcher: ResourceFetcherService,
    private readonly _resourceLegal: ResourceLegalService,
    private readonly _router: Router,
    private readonly _translate: TranslateService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this.dataRights$ = this._projectApi.get(this.resource.res.attachedToProject).pipe(
      switchMap(response => {
        const project = response.project;
        const base = {
          copyrightHolder: project.dataCopyrightHolder,
          authorship: project.dataAuthorship ?? [],
        };
        if (!project.dataLicense) {
          return of({ ...base, licenseLabel: undefined, licenseUrl: undefined } as DataRights);
        }
        return this._paginatedApi.getLicenses(project.shortcode).pipe(
          map(licenses => {
            const license = licenses.find(l => l.id === project.dataLicense);
            return { ...base, licenseLabel: license?.labelEn, licenseUrl: license?.uri } as DataRights;
          })
        );
      })
    );

    this.userHasProjectAdminRights$ = this._userService.user$.pipe(
      filterNull(),
      map(user => UserPermissions.hasProjectAdminRights(user, this.resource.res.attachedToProject))
    );
  }

  onSaveAuthorship(authorship: string[]): void {
    this._resourceLegal
      .updateResourceAuthorship(
        this.resource.res.id,
        this.resource.res.type,
        authorship,
        this.resource.res.lastModificationDate
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          // Refetch the resource so resourceAuthorship AND lastModificationDate are re-synced from
          // the server (DSP-API optimistic locking). Mirrors how property-value edits reload; without
          // this, the stale in-memory lastModificationDate makes the next save fail. The reload pushes
          // a fresh DspResource down through the viewer tree, re-binding this component's [resource].
          this._resourceFetcher.reload();
        },
        // Without this, a failed PUT (403/404/409) would close the editor silently with no feedback;
        // the displayed authorship is unchanged and the always-visible edit affordance lets the user retry.
        error: () => this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError')),
      });
  }

  /** Routes a project admin from the unconfigured callout to the project's resource-side legal settings. */
  onEditLegalInfo(): void {
    const projectUuid = ProjectService.IriToUuid(this.resource.res.attachedToProject);
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.settings, RouteConstants.legalSettings]);
  }
}
