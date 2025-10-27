import { Component, OnInit } from '@angular/core';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { MultipleViewerService } from './comparison/multiple-viewer.service';
import { DataBrowserPageService } from './data-browser-page.service';
import { ResourceResultService } from './resource-result.service';

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
  standalone: false,
})
export class DataBrowserPageComponent implements OnInit {
  constructor(
    public multipleViewerService: MultipleViewerService,
    private _projectPageService: ProjectPageService
  ) {}
  ngOnInit() {
    this.multipleViewerService.onInit(this._projectPageService.hasProjectMemberRights$);
  }
}
