import { AsyncPipe } from '@angular/common';
import { Component, ErrorHandler, Inject, inject, Input, OnChanges, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  KnoraApiConnection,
  ReadOntology,
  ReadResource,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService, userFacingReason } from '@dasch-swiss/vre/core/error-handler';
import {
  buildColumnModel,
  DataTableComponent,
  LABEL_COLUMN_KEY,
  MultipleViewerService,
  TableViewStateService,
} from '@dasch-swiss/vre/pages/data-browser';
import { RDFS_LABEL, SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { CenteredBoxComponent, CenteredMessageComponent, SearchFailedComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, first, map, Observable, of, skip, switchMap } from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { DataClassQueryService } from '../../data-class-query.service';
import { DataClassUrlStateService } from '../../data-class-url-state.service';
import { ProjectPageService } from '../../project-page.service';

/**
 * Feeds {@link DataTableComponent}.
 *
 * Deliberately a sibling of `ResourcesListFetcherComponent` rather than a shared base class: the
 * pipelines look alike but diverge at the one step that matters, and the list's is load-bearing,
 * heavily commented and covered by DEV-6866/6872 regressions. Factoring them together would mean
 * editing the list's behaviour to add the table's.
 *
 * The divergence is the second fetch. Gravsearch does the ordering, filtering, paging and counting
 * exactly as the list does, but its CONSTRUCT clause only projects properties that were filtered
 * on — so the resources it returns carry the label and little else. A table needs every column's
 * values, and Phase 6 needs each resource's full entityInfo to mount the resource editor, so the
 * page's IRIs are fetched again in one batch. Page size is 25, well under the URL-chained GET's
 * ~50-IRI ceiling.
 */
@Component({
  selector: 'app-data-table-fetcher',
  template: `
    @let data = data$ | async;
    @if (failed()) {
      <app-centered-box>
        <app-search-failed [reason]="failureReason()" (retry)="onRetry()" />
      </app-centered-box>
    } @else if (data) {
      @if (userCanViewResources) {
        @if (data.resources.length > 0) {
          <app-data-table
            [resources]="data.resources"
            [columns]="columns()"
            [visibleColumns]="layout().visible"
            [columnWidths]="layout().widths"
            [density]="layout().density"
            [selectedResourceId]="selectedResourceId()"
            [sortedColumnKey]="sortedColumnKey()"
            [sortDescending]="sortDescending()"
            (resourceSelected)="onResourceSelected($event)"
            (columnsReordered)="onColumnsReordered($event)"
            (columnResized)="onColumnResized($event)" />
        } @else if (filtersAreActive) {
          <app-centered-message
            [message]="'pages.dataBrowser.resourcesListFetcher.noResourcesMatchFilters' | translate" />
        } @else {
          <app-centered-message [message]="'pages.dataBrowser.resourcesListFetcher.noResourcesFound' | translate" />
        }
      } @else {
        <div class="no-permissions">
          <h3>{{ 'pages.dataBrowser.resourcesListFetcher.noPermissions' | translate }}</h3>
          <p>{{ 'pages.dataBrowser.resourcesListFetcher.checkPermissions' | translate }}</p>
        </div>
      }
    } @else {
      <!-- One indicator for both requests. The batch fetch is an implementation detail of showing
           a row, not a second thing the user is waiting on, so showing it its own spinner would
           make one wait look like two. -->
      <app-progress-indicator />
    }
  `,
  styleUrl: './data-table-fetcher.component.scss',
  imports: [
    AsyncPipe,
    TranslatePipe,
    DataTableComponent,
    CenteredBoxComponent,
    CenteredMessageComponent,
    AppProgressIndicatorComponent,
    SearchFailedComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class DataTableFetcherComponent implements OnChanges {
  @Input({ required: true }) ontologyLabel!: string;
  @Input({ required: true }) classLabel!: string;
  @Input({ required: true }) ontology!: ReadOntology;
  @Input({ required: true }) resClass!: ResourceClassDefinitionWithAllLanguages;

  userCanViewResources = true;

  readonly failed = signal(false);
  readonly failureReason = signal<string | undefined>(undefined);

  /**
   * The column model and the shaping the user has applied to it.
   *
   * Held in a service rather than here because the View options menu that edits them is rendered
   * by the class header, above the split — a sibling this component cannot reach with an output.
   * This component is still what *builds* the model, since it is the only one holding the
   * ontology.
   */
  private readonly _tableState = inject(TableViewStateService);
  readonly columns = this._tableState.columns;
  readonly layout = this._tableState.layout;

  readonly selectedResourceId = signal<string | undefined>(undefined);

  /**
   * The sort the query is running, mirrored onto the header that announces it.
   *
   * `rdfs:label` is the Data tab's default and is not a property IRI, so it maps onto the synthetic
   * label column's key. Phase 5 adds the controls that write this; reading it now is what lets the
   * table announce `aria-sort` from the day it renders.
   */
  readonly sortedColumnKey = signal<string | undefined>(undefined);
  readonly sortDescending = signal(false);

  /** Re-triggers the load after a failure. Replays on subscribe so the initial load runs too. */
  private readonly _retrySubject = new BehaviorSubject<void>(undefined);

  /** See the list fetcher: mirrored rather than combined, so toggling a filter is not a trigger. */
  filtersAreActive = false;

  data$!: Observable<{ resources: ReadResource[] } | null>;

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _multipleViewerService: MultipleViewerService,
    private readonly _dataBrowserPageService: DataBrowserPageService,
    private readonly _resourceResult: ResourceResultService,
    private readonly _query: DataClassQueryService,
    private readonly _searchState: SearchFilterState,
    private readonly _urlState: DataClassUrlStateService,
    private readonly _stringify: StringifyStringLiteralPipe,
    private readonly _errorHandler: ErrorHandler,
    private readonly _errorReporting: ErrorReportingService,
    public projectPageService: ProjectPageService
  ) {
    this._searchState.hasActiveState$.pipe(takeUntilDestroyed()).subscribe(active => (this.filtersAreActive = active));

    // Same reload signal the list uses, so creating a resource adds its row here too. `skip(1)`
    // drops the BehaviorSubject's replayed value, which would otherwise run the initial load twice.
    this._dataBrowserPageService.onNavigationReload$
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._retrySubject.next());

    // The table highlights whatever the viewer has open, so switching between list and table keeps
    // the user's place rather than losing it at the boundary.
    this._multipleViewerService.selectedResources$
      .pipe(takeUntilDestroyed())
      .subscribe(resources => this.selectedResourceId.set(resources[0]?.id));

    this._urlState.sortPredicateIri$
      .pipe(takeUntilDestroyed())
      .subscribe(iri => this.sortedColumnKey.set(iri === RDFS_LABEL ? LABEL_COLUMN_KEY : iri));

    this._urlState.sortDescending$.pipe(takeUntilDestroyed()).subscribe(desc => this.sortDescending.set(desc));
  }

  ngOnChanges() {
    this.failed.set(false);
    this.failureReason.set(undefined);

    this._rebuildColumns();
    this.data$ = this._retrySubject.pipe(switchMap(() => this._data$()));
  }

  onRetry() {
    this.failed.set(false);
    this._retrySubject.next();
  }

  onResourceSelected(resource: ReadResource) {
    this._multipleViewerService.selectOneResource(resource);
  }

  /**
   * Both shaping gestures persist and redraw, and neither re-runs the query: the page's resources
   * already carry every property, so which columns are drawn and how wide they are is a rendering
   * decision the client makes on its own (REQ-2.3).
   */
  onColumnsReordered(order: string[]) {
    this._tableState.setVisibleOrder(order);
  }

  onColumnResized({ key, width }: { key: string; width: number }) {
    this._tableState.setColumnWidth(key, width);
  }

  /**
   * The class's columns, and the layout the user last left them in.
   *
   * Built from the ontology's own property definitions rather than from `OntologyDataService`,
   * which filters to editable non-link properties — the table shows link, file and non-editable
   * columns too, read-only.
   */
  private _rebuildColumns(): void {
    const definitions = new Map(
      this.ontology
        .getPropertyDefinitionsByType(ResourcePropertyDefinitionWithAllLanguages)
        .map(propDef => [propDef.id, propDef])
    );

    const columns = buildColumnModel(
      this.resClass,
      definitions,
      propDef => this._stringify.transform(propDef.labels),
      'Label'
    );

    this._tableState.init(this.resClass.id, columns);
  }

  private _data$(): Observable<{ resources: ReadResource[] } | null> {
    const resources$ = this.projectPageService.currentProject$.pipe(
      first(),
      switchMap(project =>
        this._query.query$.pipe(
          switchMap((query, queryIndex) => {
            // The list fetcher is the sole writer of the page index on a query change; only one of
            // the two views is mounted at a time, so whichever is showing owns the reset.
            if (queryIndex > 0) {
              this._resourceResult.updatePageIndex(0);
            }

            return combineLatest([this._pagedResources$(query, project.id), this._countQuery$(query, project.id)]);
          })
        )
      ),
      map(([{ resources, pageIndex }, numberOfResults]) => this._applyCount(resources, pageIndex, numberOfResults))
    );

    return resources$.pipe(
      map(resources => ({ resources })),
      catchError((error: unknown) => {
        this._resourceResult.numberOfResults = null;
        this.failureReason.set(userFacingReason(error));
        this.failed.set(true);
        this._errorHandler.handleError(error);
        return of(null);
      })
    );
  }

  /** Identical heuristic to the list's: see `ResourcesListFetcherComponent._applyCount`. */
  private _applyCount(resources: ReadResource[], pageIndex: number, numberOfResults: number | null): ReadResource[] {
    this.userCanViewResources =
      numberOfResults === null ||
      this.filtersAreActive ||
      !(pageIndex === 0 && resources.length === 0 && numberOfResults > 0);

    this._resourceResult.numberOfResults = numberOfResults;
    return resources;
  }

  private _pagedResources$(query: string, projectIri: string) {
    return this._resourceResult.pageIndex$.pipe(
      switchMap(pageIndex =>
        this._performGravSearch(query, pageIndex, projectIri).pipe(
          // The second fetch. Errors are *not* absorbed here: unlike the count, a failed batch
          // means there is nothing to draw, so it propagates to the outer catchError and the
          // retryable failure panel.
          switchMap(response => this._fullResources$(response.resources)),
          map(resources => ({ resources, pageIndex }))
        )
      )
    );
  }

  /**
   * Re-fetch the page's resources in full.
   *
   * Short-circuits on an empty page rather than issuing a request for no IRIs, which the
   * URL-chained GET cannot express anyway.
   */
  private _fullResources$(pageResources: ReadResource[]): Observable<ReadResource[]> {
    const iris = pageResources.map(resource => resource.id);
    if (iris.length === 0) {
      return of([]);
    }

    return this._dspApiConnection.v2.res.getResources(iris).pipe(
      map(response => (Array.isArray(response) ? response : response.resources)),
      // dsp-api does not guarantee the order of a multi-resource fetch, but the Gravsearch result
      // *is* the sort the user asked for — so the batch is reordered back onto it rather than
      // trusted. A resource the batch did not return is dropped: it disappeared or became
      // unreadable between the two requests, and a row with no data is worse than no row.
      map(full => {
        const byIri = new Map(full.map(resource => [resource.id, resource]));
        return iris.map(iri => byIri.get(iri)).filter((resource): resource is ReadResource => resource !== undefined);
      })
    );
  }

  private _countQuery$(query: string, projectIri: string) {
    return this._dspApiConnection.v2.search.doExtendedSearchCountQuery(query, projectIri).pipe(
      map(response => response.numberOfResults),
      catchError((error: unknown) => {
        this._errorReporting.report(error, {
          component: 'DataTableFetcherComponent',
          operation: 'gravsearchCountQuery',
        });
        return of(null);
      })
    );
  }

  private _performGravSearch(query: string, index: number, projectIri: string) {
    // `lastIndexOf`: a fulltext term can contain the word OFFSET, and cutting at the first
    // occurrence would truncate the query mid-clause.
    const offsetAt = query.lastIndexOf('OFFSET');
    const gravsearch = `${offsetAt === -1 ? query : query.substring(0, offsetAt)}OFFSET ${index}`;

    return this._dspApiConnection.v2.search.doExtendedSearch(gravsearch, projectIri);
  }
}
