import { AsyncPipe } from '@angular/common';
import { Component, computed, ErrorHandler, Inject, inject, Input, OnChanges, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  KnoraApiConnection,
  ReadOntology,
  ReadResource,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService, userFacingReason } from '@dasch-swiss/vre/core/error-handler';
import { UserService } from '@dasch-swiss/vre/core/session';
import {
  buildColumnModel,
  DataTableComponent,
  imageColumn,
  LABEL_COLUMN_KEY,
  MultipleViewerService,
  rightsColumns,
  TableViewStateService,
} from '@dasch-swiss/vre/pages/data-browser';
import {
  FilterEditorRequestService,
  RDFS_LABEL,
  SearchFilterState,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { ProjectDataRightsService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { CenteredBoxComponent, CenteredMessageComponent, SearchFailedComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, first, map, Observable, of, skip, switchMap, tap } from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { DataClassQueryService } from '../../data-class-query.service';
import { DataClassUrlStateService } from '../../data-class-url-state.service';
import { ProjectPageService } from '../../project-page.service';

/**
 * Feeds {@link DataTableComponent}. Parallels `ResourcesListFetcherComponent` but fetches the
 * page's IRIs again in one batch: Gravsearch's CONSTRUCT only projects filtered properties, and the
 * table needs every column's values and each resource's full entityInfo. Page size 25 is well under
 * the URL-chained GET's ~50-IRI ceiling.
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
          <!-- The rows stay while the next results load; the class header shows the wait. -->
          <app-data-table
            [attr.aria-busy]="isRefreshing()"
            [resources]="data.resources"
            [columns]="columns()"
            [projectRights]="projectRights()"
            [visibleColumns]="layout().visible"
            [columnWidths]="layout().widths"
            [rowHeight]="layout().rowHeight"
            [checkedResourceIds]="checkedResourceIds()"
            [selectionActive]="selectionActive()"
            [selectable]="isLoggedIn()"
            [canEdit]="canEdit()"
            [sortedColumnKey]="sortedColumnKey()"
            [sortDescending]="sortDescending()"
            [filteredColumnKeys]="filteredColumnKeys()"
            [pinnedColumns]="layout().pinned ?? []"
            (resourceCheckedChanged)="onResourceCheckedChanged($event)"
            (columnsReordered)="onColumnsReordered($event)"
            (columnResized)="onColumnResized($event)"
            (columnWidthReset)="onColumnWidthReset($event)"
            (sortToggled)="onSortToggled($event)"
            (filterRequested)="onFilterRequested($event)"
            (columnPinToggled)="onColumnPinToggled($event)"
            (resourceReloaded)="onResourceReloaded($event)" />
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

  /** Column model and layout live in a service because the View options menu is in the class header. */
  private readonly _tableState = inject(TableViewStateService);
  readonly columns = this._tableState.columns;

  /** Whether the rows on screen are about to be replaced. See `ResourceResultService.isRefreshing`. */
  readonly isRefreshing = computed(() => this._resourceResult.isRefreshing());

  /** Selecting rows for comparison is for signed-in users only. */
  readonly isLoggedIn = toSignal(inject(UserService).isLoggedIn$, { initialValue: false });

  /** Project members can edit its data, so only they are shown which columns they cannot. */
  readonly canEdit = toSignal(inject(ProjectPageService).hasProjectMemberRights$, { initialValue: false });

  /** The project's legal info for the rights columns; a failure leaves them unfilled instead of failing the table. */
  private readonly _dataRights = inject(ProjectDataRightsService);
  private readonly _translate = inject(TranslateService);

  readonly projectRights = toSignal(
    inject(ProjectPageService).currentProject$.pipe(
      first(),
      switchMap(project => this._dataRights.fromProject(project)),
      catchError(() => of(undefined))
    )
  );
  readonly layout = this._tableState.layout;

  /**
   * The comparison selection as last published. `MultipleViewerService` writes `selectMode` *after*
   * pushing the selection, so the flag must be read in a computed, not at subscription time.
   */
  private readonly _selectedResources = signal<ReadResource[]>([]);

  /**
   * Whether the user is building a comparison set. `selectMode` is a plain field, so this computed
   * and `checkedResourceIds` must read the signal first, unconditionally: short-circuiting on
   * `selectMode` registers no dependency and caches `false` forever.
   */
  readonly selectionActive = computed<boolean>(() => {
    const selected = this._selectedResources();
    return this._multipleViewerService.selectMode && selected.length > 0;
  });

  /** Which rows are in the comparison set, so their checkboxes read as checked. */
  readonly checkedResourceIds = computed<ReadonlySet<string>>(() => {
    const selected = this._selectedResources();
    return this._multipleViewerService.selectMode ? new Set(selected.map(resource => resource.id)) : new Set<string>();
  });

  /** The sort the query is running, so the table can announce `aria-sort`. */
  readonly sortedColumnKey = signal<string | undefined>(undefined);
  readonly sortDescending = signal(false);

  /** Which columns carry a filter chip, read off the shared filter state. */
  readonly filteredColumnKeys = signal<ReadonlySet<string>>(new Set<string>());

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
    private readonly _filterEditorRequests: FilterEditorRequestService,
    private readonly _urlState: DataClassUrlStateService,
    private readonly _stringify: StringifyStringLiteralPipe,
    private readonly _errorHandler: ErrorHandler,
    private readonly _errorReporting: ErrorReportingService,
    public projectPageService: ProjectPageService
  ) {
    this._searchState.hasActiveState$.pipe(takeUntilDestroyed()).subscribe(active => (this.filtersAreActive = active));

    // Column titles are resolved once per build.
    this._translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this._rebuildColumns());

    // `skip(1)` drops the BehaviorSubject's replayed value, which would run the initial load twice.
    this._dataBrowserPageService.onNavigationReload$
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._retrySubject.next());

    // The service is provided above both views, so the selection survives a list/table switch.
    this._multipleViewerService.selectedResources$
      .pipe(takeUntilDestroyed())
      .subscribe(resources => this._selectedResources.set(resources));

    this._urlState.sortPredicateIri$
      .pipe(takeUntilDestroyed())
      .subscribe(iri => this.sortedColumnKey.set(this._columnKeyOf(iri)));

    this._urlState.sortDescending$.pipe(takeUntilDestroyed()).subscribe(desc => this.sortDescending.set(desc));

    // A subcriterion constrains a linked resource, not a column of this table.
    this._searchState.filters$
      .pipe(takeUntilDestroyed())
      .subscribe(filters =>
        this.filteredColumnKeys.set(
          new Set(
            filters
              .filter(filterParam => filterParam.parentIndex === null || filterParam.parentIndex === undefined)
              .map(filterParam => this._columnKeyOf(filterParam.predicateIri))
          )
        )
      );
  }

  ngOnChanges() {
    this.failed.set(false);
    this.failureReason.set(undefined);

    this._rebuildColumns();
    this._resourceResult.resetLoading();
    this.data$ = this._retrySubject.pipe(switchMap(() => this._data$()));
  }

  onRetry() {
    this.failed.set(false);
    this._resourceResult.resetLoading();
    this._retrySubject.next();
  }

  /** A cell was saved: announce the IRI so the viewer re-reads the resource. */
  onResourceReloaded(resource: ReadResource) {
    this._multipleViewerService.notifyResourceChanged(resource.id);
  }

  /** Maps the row checkbox onto the calls `ResourceListItemComponent` makes; the viewer enforces the cap. */
  onResourceCheckedChanged({ resource, checked }: { resource: ReadResource; checked: boolean }) {
    if (checked) {
      this._multipleViewerService.addResources([resource]);
    } else {
      this._multipleViewerService.removeResources([resource]);
    }
  }

  onColumnsReordered(order: string[]) {
    this._tableState.setVisibleOrder(order);
  }

  onColumnPinToggled(key: string) {
    this._tableState.togglePinned(key);
  }

  onColumnResized({ key, width }: { key: string; width: number }) {
    this._tableState.setColumnWidth(key, width);
  }

  onColumnWidthReset(key: string) {
    this._tableState.resetColumnWidth(key);
  }

  /** Shares the sort state with the list's sort header. The page reset happens in `_data$`, not here. */
  onSortToggled({ key, descending }: { key: string; descending: boolean }) {
    this._urlState.setSort(this._predicateIriOf(key), descending);
  }

  /** The chip bar owns the editor: it alone can re-open an existing chip instead of doubling it. */
  onFilterRequested(key: string) {
    this._filterEditorRequests.open(this._predicateIriOf(key));
  }

  /** The URL and filter codec call the label `rdfs:label`; the column model uses the synthetic label column key. */
  private _columnKeyOf(predicateIri: string): string {
    return predicateIri === RDFS_LABEL ? LABEL_COLUMN_KEY : predicateIri;
  }

  private _predicateIriOf(columnKey: string): string {
    return columnKey === LABEL_COLUMN_KEY ? RDFS_LABEL : columnKey;
  }

  /** Built from the ontology's property definitions, not `OntologyDataService`, which drops link and non-editable properties. */
  private _rebuildColumns(): void {
    const definitions = new Map(
      this.ontology
        .getPropertyDefinitionsByType(ResourcePropertyDefinitionWithAllLanguages)
        .map(propDef => [propDef.id, propDef])
    );

    const [label, ...properties] = buildColumnModel(
      this.resClass,
      definitions,
      propDef => this._stringify.transform(propDef.labels),
      this._translate.instant('pages.dataBrowser.table.labelColumn')
    );
    const columns = [
      label,
      ...imageColumn(this.resClass, this._translate.instant('pages.dataBrowser.table.imageColumn')),
      ...properties,
      ...rightsColumns({
        license: this._translate.instant('legal.dataSide.license'),
        copyrightHolder: this._translate.instant('legal.dataSide.copyrightHolder'),
        authorship: this._translate.instant('legal.dataSide.authorship'),
      }),
    ];

    this._tableState.init(this.resClass.id, columns);
  }

  private _data$(): Observable<{ resources: ReadResource[] } | null> {
    const resources$ = this.projectPageService.currentProject$.pipe(
      first(),
      switchMap(project =>
        this._query.query$.pipe(
          switchMap((query, queryIndex) => {
            // Only one of the two fetchers is mounted, so whichever is showing owns the reset.
            if (queryIndex > 0) {
              this._resourceResult.updatePageIndex(0);
            }

            this._resourceResult.markLoading();
            return combineLatest([this._pagedResources$(query, project.id), this._countQuery$(query, project.id)]);
          })
        )
      ),
      map(([{ resources, pageIndex }, numberOfResults]) => this._applyCount(resources, pageIndex, numberOfResults)),
      tap(() => this._resourceResult.markLoaded())
    );

    return resources$.pipe(
      map(resources => ({ resources })),
      catchError((error: unknown) => {
        this._resourceResult.markFailed();
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
    // Recorded even though the table selects nothing, or the list would treat a switch as a fresh entry.
    this._dataBrowserPageService.selectionResolvedForClass = this.classLabel;

    this.userCanViewResources =
      numberOfResults === null ||
      this.filtersAreActive ||
      !(pageIndex === 0 && resources.length === 0 && numberOfResults > 0);

    this._resourceResult.numberOfResults = numberOfResults;
    return resources;
  }

  private _pagedResources$(query: string, projectIri: string) {
    return this._resourceResult.pageIndex$.pipe(
      tap(() => this._resourceResult.markLoading()),
      switchMap(pageIndex =>
        this._performGravSearch(query, pageIndex, projectIri).pipe(
          // Not absorbed on error, unlike the count: a failed batch leaves nothing to draw.
          switchMap(response => this._fullResources$(response.resources)),
          map(resources => ({ resources, pageIndex }))
        )
      )
    );
  }

  /** Re-fetch the page's resources in full; an empty page short-circuits (the URL-chained GET cannot express no IRIs). */
  private _fullResources$(pageResources: ReadResource[]): Observable<ReadResource[]> {
    const iris = pageResources.map(resource => resource.id);
    if (iris.length === 0) {
      return of([]);
    }

    return this._dspApiConnection.v2.res.getResources(iris).pipe(
      map(response => (Array.isArray(response) ? response : response.resources)),
      // dsp-api does not guarantee the batch order, so restore the Gravsearch (sort) order. A
      // resource the batch did not return is dropped.
      map(full => {
        // Tuple annotated: the app build infers `any[]` for the pair.
        const byIri = new Map(full.map((resource): [string, ReadResource] => [resource.id, resource]));
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
    // `lastIndexOf`: a fulltext term can contain the word OFFSET.
    const offsetAt = query.lastIndexOf('OFFSET');
    const gravsearch = `${offsetAt === -1 ? query : query.substring(0, offsetAt)}OFFSET ${index}`;

    return this._dspApiConnection.v2.search.doExtendedSearch(gravsearch, projectIri);
  }
}
