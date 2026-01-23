import { Component, Input } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceListComponent } from './resource-list.component';

@Component({
  selector: 'app-resources-list',
  template: ` @if (showBackToFormButton) {
      <div style="padding: 16px; display: flex; flex-direction: row-reverse">
        <a mat-stroked-button (click)="navigate()">
          <mat-icon>chevron_left</mat-icon>{{ 'pages.dataBrowser.resourcesList.backToSearchForm' | translate }}
        </a>
      </div>
    }

    @if (resourceResultService.numberOfResults > resourceResultService.MAX_RESULTS_PER_PAGE) {
      <app-pager
        (pageIndexChanged)="updatePageIndex($event)"
        [numberOfAllResults]="resourceResultService.numberOfResults" />
    }

    <app-resource-list [resources]="resources" [showProjectShortname]="showProjectShortname" />`,
  styles: [
    `
      app-pager {
        margin: 8px;
      }
    `,
  ],
  imports: [MatAnchor, MatIcon, TranslatePipe, PagerComponent, ResourceListComponent],
})
export class ResourcesListComponent {
  @Input({ required: true }) resources!: ReadResource[];
  @Input({ required: true }) showBackToFormButton!: boolean;
  @Input() showProjectShortname = false;

  constructor(
    public resourceResultService: ResourceResultService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute
  ) {}

  updatePageIndex(index: number) {
    this.resourceResultService.updatePageIndex(index);
  }

  navigate() {
    const projectUuid = this._route.parent?.snapshot.params['uuid'];
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.advancedSearch]);
  }
}
