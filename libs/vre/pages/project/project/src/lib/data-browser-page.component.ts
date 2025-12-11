import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AngularSplitModule } from 'angular-split';
import { DataBrowserPageService } from './data-browser-page.service';
import { ProjectSidenavComponent } from './sidenav/project-sidenav.component';

/**
 * Container component for the data browser page with split layout.
 * Provides scoped service instances (MultipleViewerService, ResourceResultService, DataBrowserPageService)
 * that are shared across child components within this page.
 */
@Component({
  selector: 'app-data-browser-page',
  template: `<div style="display: flex; flex-direction: column; height: 100%">
    <as-split direction="horizontal">
      <as-split-area [size]="25">
        <app-project-sidenav />
      </as-split-area>
      <as-split-area [size]="75">
        <router-outlet />
      </as-split-area>
    </as-split>
  </div> `,
  providers: [MultipleViewerService, ResourceResultService, DataBrowserPageService],
  standalone: true,
  imports: [RouterOutlet, AngularSplitModule, ProjectSidenavComponent],
})
export class DataBrowserPageComponent {}
