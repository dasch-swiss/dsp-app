import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ResourceLegalV2ApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import {
  DspResource,
  filterNull,
  ProjectDataRights,
  ProjectDataRightsService,
  UserPermissions,
} from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceUtil } from '../representation/resource.util';

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

  dataRights$!: Observable<ProjectDataRights>;
  userHasProjectAdminRights$!: Observable<boolean>;

  get canEditAuthorship(): boolean {
    return ResourceUtil.userCanEdit(this.resource.res);
  }

  constructor(
    private readonly _dataRights: ProjectDataRightsService,
    private readonly _destroyRef: DestroyRef,
    private readonly _notification: NotificationService,
    private readonly _resourceFetcher: ResourceFetcherService,
    private readonly _resourceLegal: ResourceLegalV2ApiService,
    private readonly _router: Router,
    private readonly _translate: TranslateService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this.dataRights$ = this._dataRights.forProject(this.resource.res.attachedToProject);
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
        next: () => this._resourceFetcher.reload(),
        error: () => this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError')),
      });
  }

  onEditLegalInfo(): void {
    const projectUuid = ProjectService.IriToUuid(this.resource.res.attachedToProject);
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.settings, RouteConstants.legalSettings]);
  }
}
