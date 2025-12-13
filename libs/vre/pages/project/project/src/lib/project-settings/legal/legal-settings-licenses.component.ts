import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, catchError, map, shareReplay, switchMap, tap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { LicenseToggleEvent, LicensesEnabledTableComponent } from './licenses-enabled-table.component';

@Component({
  selector: 'app-legal-settings-licenses',
  template: ` @if (project$ | async; as project) {
    @if (recommendedLicenses$ | async; as recommendedLicenses) {
      <div style="margin-bottom: 24px">
        @if (recommendedLicenses.length > 0) {
          <app-licenses-enabled-table
            [licenses]="recommendedLicenses"
            [project]="project"
            [label]="'pages.project.legalSettings.recommended' | translate"
            (licenseToggle)="onLicenseToggle($event)" />
        }
      </div>
    }
    @if (nonRecommendedLicenses$ | async; as nonRecommendedLicenses) {
      @if (nonRecommendedLicenses.length > 0) {
        <app-licenses-enabled-table
          [licenses]="nonRecommendedLicenses"
          [project]="project"
          [label]="'pages.project.legalSettings.notRecommended' | translate"
          (licenseToggle)="onLicenseToggle($event)" />
      }
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, LicensesEnabledTableComponent, TranslateModule],
})
export class LegalSettingsLicensesComponent {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  readonly project$ = this._reloadSubject
    .asObservable()
    .pipe(switchMap(() => this._projectPageService.currentProject$));

  licenses$ = this.project$.pipe(
    switchMap(project => this._paginatedApi.getLicenses(project.shortcode)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  recommendedLicenses$ = this.licenses$.pipe(map(licenses => licenses.filter(license => license.isRecommended)));
  nonRecommendedLicenses$ = this.licenses$.pipe(map(licenses => licenses.filter(license => !license.isRecommended)));

  constructor(
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _notification: NotificationService
  ) {}

  onLicenseToggle(event: LicenseToggleEvent): void {
    const project = this._projectPageService.currentProject;

    const apiCall = event.enabled
      ? this._adminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable(
          project.shortcode,
          event.licenseId
        )
      : this._adminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable(
          project.shortcode,
          event.licenseId
        );

    apiCall
      .pipe(
        tap(() => this._reloadSubject.next()),
        catchError(error => {
          this._notification.openSnackBar(
            `Failed to ${event.enabled ? 'enable' : 'disable'} license. Please try again.`
          );
          this._reloadSubject.next();
          throw error;
        })
      )
      .subscribe();
  }
}
