import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { tap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { LicenseCaptionsMapping } from './license-captions-mapping';
import { ProjectDescriptionPageComponent } from './project-description-page.component';

@Component({
  selector: 'app-project-short-description',
  standalone: false,
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
        <button mat-stroked-button (click)="readMore()" style="margin: 16px">Read more</button>
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
    private _projectPageService: ProjectPageService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
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
