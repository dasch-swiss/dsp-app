import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Component, ViewContainerRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ProjectImageCoverComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { map, of, switchMap, tap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { LicenseCaptionsMapping } from './license-captions-mapping';
import { ProjectDescriptionPageComponent } from './project-description-page.component';

@Component({
  selector: 'app-project-short-description',
  imports: [
    AsyncPipe,
    UpperCasePipe,
    TranslatePipe,
    MatButton,
    ProjectImageCoverComponent,
    ResourceRightsStatementComponent,
  ],
  template: `
    @if (readProject$ | async; as project) {
      <div>
        <app-project-image-cover [project]="project" />
        @if (hasManualLicense) {
          <div class="mat-caption">{{ hasManualLicense }}</div>
        }
      </div>
      <h2>{{ project.longname }}</h2>
      <h3 class="mat-body subtitle" style="margin-bottom: 32px">
        Project {{ project.shortcode }} | {{ project.shortname | uppercase }}
      </h3>

      <div style="position: relative; max-height: 120px; padding: 16px; overflow: hidden">
        <div [innerHtml]="project.description[0].value"></div>
        <div
          style="
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 32px;
      background: linear-gradient(to bottom, transparent, white 80%);
      pointer-events: none;
    "></div>
      </div>
      <button mat-stroked-button (click)="readMore()" style="margin: 16px">
        {{ 'pages.project.projectShortDescription.readMore' | translate }}
      </button>

      @if (dataRights$ | async; as rights) {
        <div style="border-top: 1px solid #ebebeb; margin: 0 16px; text-align: left">
          <app-resource-rights-statement
            [licenseLabel]="rights.licenseLabel"
            [licenseUrl]="rights.licenseUrl"
            [copyrightHolder]="rights.project.dataCopyrightHolder"
            [authorship]="rights.project.dataAuthorship ?? []"
            [perResource]="false"
            [isAdmin]="false"
            labelAlign="start" />
        </div>
      }
    }
  `,
})
export class ProjectShortDescriptionComponent {
  hasManualLicense?: string;
  readProject$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this.hasManualLicense = LicenseCaptionsMapping.get(project.shortcode);
    })
  );

  /** The project's data-side legal info, resolved like the expanded description page. */
  dataRights$ = this._projectPageService.currentProject$.pipe(
    switchMap(project => {
      if (!project.dataLicense) {
        return of({
          project,
          licenseLabel: undefined as string | undefined,
          licenseUrl: undefined as string | undefined,
        });
      }
      return this._paginatedApi.getLicenses(project.shortcode).pipe(
        map(licenses => {
          const license = licenses.find(l => l.id === project.dataLicense);
          return { project, licenseLabel: license?.labelEn, licenseUrl: license?.uri };
        })
      );
    })
  );

  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _paginatedApi: PaginatedApiService
  ) {}

  readMore() {
    this._dialog.open(ProjectDescriptionPageComponent, {
      ...DspDialogConfig.dialogDrawerConfig({}, true),
      viewContainerRef: this._viewContainerRef,
      width: '800px',
    });
  }
}
