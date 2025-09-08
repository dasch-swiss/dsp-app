import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ResourceResultService } from '../resource-result.service';

@Component({
  selector: 'app-resources-list',
  template: `<div style="padding: 16px; display: flex; flex-direction: row-reverse">
      @if (showBackToFormButton) {
        <a mat-stroked-button (click)="navigate()"><mat-icon>chevron_left</mat-icon>Back to search form</a>
      }
    </div>
    <app-pager
      (pageIndexChanged)="updatePageIndex($event)"
      [numberOfAllResults]="resourceResultService.numberOfResults" />
    @if (multipleViewerService.selectMode) {
      <app-resource-list-selection [resources]="resources" />
    }
    <app-resource-list [resources]="resources" />`,
})
export class ResourcesListComponent {
  @Input({ required: true }) resources!: ReadResource[];
  @Input({ required: true }) showBackToFormButton!: boolean;

  constructor(
    public multipleViewerService: MultipleViewerService,
    public resourceResultService: ResourceResultService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  updatePageIndex(index: number) {
    this.resourceResultService.updatePageIndex(index);
  }

  navigate() {
    const projectUuid = this._route.parent?.snapshot.params['uuid'];
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.advancedSearch]);
  }
}
