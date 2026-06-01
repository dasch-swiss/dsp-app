import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges, signal } from '@angular/core';
import { IFulltextSearchParams, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { combineLatest, map, Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-search-result',
  imports: [
    AsyncPipe,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    ResourceBrowserComponent,
    AppProgressIndicatorComponent,
  ],
  template: `
    @let resources = resources$ | async;
    @if (!resources && loading()) {
      <app-progress-indicator />
    } @else if (resources) {
      @if (resources.length === 0) {
        <app-centered-box>
          <app-no-results-found [message]="noResultMessage" />
        </app-centered-box>
      } @else {
        <app-resource-browser
          [data]="{ resources: resources, selectFirstResource: true }"
          [searchKeyword]="query"
          [showProjectShortname]="showProjectShortname"
          [loading]="loading()" />
      }
    }
  `,
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultComponent implements OnChanges {
  @Input({ required: true }) query!: string;
  @Input() projectId?: string;
  @Input() showProjectShortname = false;

  readonly loading = signal(true);

  resources$!: Observable<ReadResource[]>;

  readonly noResultMessage = 'There are no resources to display.';

  get searchInProjectParam(): IFulltextSearchParams {
    return this.projectId
      ? {
          limitToProject: this.projectId,
        }
      : {};
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _resourceResultService: ResourceResultService
  ) {}

  ngOnChanges() {
    this.loading.set(true);

    this.resources$ = combineLatest([
      this._resourceResultService.pageIndex$.pipe(
        tap(() => this.loading.set(true)),
        switchMap(pageNumber =>
          this._dspApiConnection.v2.search.doFulltextSearch(this.query, pageNumber, this.searchInProjectParam)
        )
      ),
      this._numberOfAllResults$(this.query),
    ]).pipe(
      tap(([, countResponse]) => {
        this._resourceResultService.numberOfResults = countResponse.numberOfResults;
      }),
      map(([resourceResponse]) => {
        this.loading.set(false);
        return resourceResponse.resources;
      })
    );
  }

  private _numberOfAllResults$ = (query: string) =>
    this._dspApiConnection.v2.search.doFulltextSearchCountQuery(query, 0, this.searchInProjectParam);
}
