import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaginatedApiService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { BehaviorSubject, map, shareReplay, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

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
            (refresh)="refresh()" />
        }
      </div>
    }
    @if (nonRecommendedLicenses$ | async; as nonRecommendedLicenses) {
      @if (nonRecommendedLicenses.length > 0) {
        <app-licenses-enabled-table
          [licenses]="nonRecommendedLicenses"
          [project]="project"
          [label]="'pages.project.legalSettings.notRecommended' | translate"
          (refresh)="refresh()" />
      }
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private _paginatedApi: PaginatedApiService,
    private _projectPageService: ProjectPageService
  ) {}

  refresh() {
    this._reloadSubject.next();
  }
}
