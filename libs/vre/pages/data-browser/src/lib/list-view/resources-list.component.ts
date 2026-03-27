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
  template: `
    @if (isAdvancedSearchContext) {
      <div class="back-button-container">
        <a mat-stroked-button (click)="navigateBackToSearchForm()">
          <mat-icon>chevron_left</mat-icon>{{ 'pages.dataBrowser.resourcesList.backToSearchForm' | translate }}
        </a>
      </div>
    }

    @if (resourceResultService.numberOfResults > resourceResultService.MAX_RESULTS_PER_PAGE) {
      <app-pager
        (pageIndexChanged)="updatePageIndex($event)"
        [numberOfAllResults]="resourceResultService.numberOfResults" />
    } @else {
      <div class="results-count">
        {{
          'pages.dataBrowser.resourcesList.resultsCount' | translate: { count: resourceResultService.numberOfResults }
        }}
      </div>
    }

    <app-resource-list [resources]="resources" [showProjectShortname]="showProjectShortname" />
  `,
  styleUrls: ['./resources-list.component.scss'],
  imports: [MatAnchor, MatIcon, PagerComponent, ResourceListComponent, TranslatePipe],
})
export class ResourcesListComponent {
  @Input({ required: true }) resources!: ReadResource[];
  @Input() showProjectShortname = false;

  readonly isAdvancedSearchContext: boolean;

  constructor(
    public resourceResultService: ResourceResultService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute
  ) {
    this.isAdvancedSearchContext = this._router.url.includes(`${RouteConstants.advancedSearch}/results`);
  }

  updatePageIndex(index: number) {
    this.resourceResultService.updatePageIndex(index);
  }

  navigateBackToSearchForm() {
    this._router.navigate(['..'], {
      relativeTo: this._route,
      queryParamsHandling: 'preserve',
    });
  }
}
