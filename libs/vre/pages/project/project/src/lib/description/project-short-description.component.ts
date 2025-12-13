import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ProjectImageCoverComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { TranslateModule } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { LicenseCaptionsMapping } from './license-captions-mapping';
import { ProjectDescriptionPageComponent } from './project-description-page.component';

@Component({
  selector: 'app-project-short-description',
  imports: [AsyncPipe, UpperCasePipe, TranslateModule, MatButton, ProjectImageCoverComponent],
  template: `
    @if (readProject$ | async; as project) {
      @if (test) {
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
      }
    }
  `,
})
export class ProjectShortDescriptionComponent implements OnInit {
  hasManualLicense?: string;
  readProject$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this.hasManualLicense = LicenseCaptionsMapping.get(project.shortcode);
    })
  );
  test = false;

  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.test = true;
    }, 0);
  }

  readMore() {
    this._dialog.open(ProjectDescriptionPageComponent, {
      ...DspDialogConfig.dialogDrawerConfig({}, true),
      viewContainerRef: this._viewContainerRef,
      width: '800px',
    });
  }
}
