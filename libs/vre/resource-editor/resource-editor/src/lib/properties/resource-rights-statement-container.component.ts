import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ResourceLegalV2ApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DspResource, filterNull, UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import {
  ProjectDataRights,
  ProjectDataRightsService,
  ProjectService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, switchMap } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceUtil } from '../representation/resource.util';

@Component({
  selector: 'app-resource-rights-statement-container',
  template: `
    @if (viewModel$ | async; as vm) {
      <app-resource-rights-statement
        [licenseLabel]="vm.rights.licenseLabel"
        [licenseUrl]="vm.rights.licenseUrl"
        [copyrightHolder]="vm.rights.copyrightHolder"
        [authorship]="vm.rights.authorship"
        [resourceAuthorship]="vm.resourceAuthorship"
        [isAdmin]="vm.isAdmin"
        [canEditAuthorship]="vm.canEditAuthorship"
        (saveAuthorship)="onSaveAuthorship($event)"
        (editLegalInfo)="onEditLegalInfo()" />
    }
  `,
  imports: [AsyncPipe, ResourceRightsStatementComponent],
})
export class ResourceRightsStatementContainerComponent implements OnInit {
  @Input({ required: true }) set resource(value: DspResource) {
    this._resource$.next(value);
  }
  get resource(): DspResource {
    // Non-null: setter is called before any consumer of `resource` runs (required @Input).
    return this._resource$.value!;
  }

  private readonly _resource$ = new BehaviorSubject<DspResource | null>(null);

  viewModel$!: Observable<{
    rights: ProjectDataRights;
    resourceAuthorship: string[];
    isAdmin: boolean;
    canEditAuthorship: boolean;
  }>;

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
    const resource$ = this._resource$.pipe(filter((r): r is DspResource => r !== null));

    // Refetch project rights only when the resource's project actually changes; unrelated resource
    // re-bindings (same project) keep the shared cache warm.
    const rights$ = resource$.pipe(
      map(resource => resource.res.attachedToProject),
      distinctUntilChanged(),
      switchMap(projectIri => this._dataRights.forProject(projectIri))
    );

    const isAdmin$ = combineLatest([resource$, this._userService.user$.pipe(filterNull())]).pipe(
      map(([resource, user]) => UserPermissions.hasProjectAdminRights(user, resource.res.attachedToProject))
    );

    this.viewModel$ = combineLatest([resource$, rights$, isAdmin$]).pipe(
      map(([resource, rights, isAdmin]) => ({
        rights,
        resourceAuthorship: resource.res.resourceAuthorship,
        isAdmin,
        canEditAuthorship: ResourceUtil.userCanEdit(resource.res),
      }))
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
          this._resourceFetcher.reload();
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saved'));
        },
        error: () => this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError')),
      });
  }

  onEditLegalInfo(): void {
    const projectUuid = ProjectService.IriToUuid(this.resource.res.attachedToProject);
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.settings, RouteConstants.legalSettings]);
  }
}
