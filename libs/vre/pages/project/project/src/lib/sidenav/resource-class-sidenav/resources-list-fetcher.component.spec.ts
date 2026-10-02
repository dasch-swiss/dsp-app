import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService } from '@dasch-swiss/vre/core/error-handler';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { DataBrowserPageService, ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { DataClassQueryService } from '../../data-class-query.service';
import { ResourcesListFetcherComponent } from './resources-list-fetcher.component';

describe('ResourcesListFetcherComponent', () => {
  let component: ResourcesListFetcherComponent;
  let fixture: ComponentFixture<ResourcesListFetcherComponent>;
  let mockDspApiConnection: any;
  let mockMultipleViewerService: any;
  let routeParamsSubject: BehaviorSubject<any>;
  let currentProjectSubject: BehaviorSubject<ReadProject>;
  /** The query the component is told to run. A filter, sort or class change is a new value here. */
  let querySubject: BehaviorSubject<string>;
  let hasActiveStateSubject: BehaviorSubject<boolean>;
  /** Real instance: the reload trigger is a BehaviorSubject whose replay behaviour is under test. */
  let dataBrowserPageService: DataBrowserPageService;
  let handleError: jest.Mock;
  let report: jest.Mock;

  const mockResource1 = { id: 'resource-1', label: 'Resource 1' } as ReadResource;
  const mockResource2 = { id: 'resource-2', label: 'Resource 2' } as ReadResource;
  const mockProject = { shortcode: '0001', id: 'http://rdfh.ch/projects/0001' } as ReadProject;

  const QUERY = 'CONSTRUCT { ?mainRes knora-api:isMainResource true . } WHERE { ?mainRes a <C> . }\nOFFSET 0';

  /** Shared so the real-template suite below can reuse the same doubles without duplicating them. */
  const makeProviders = () => [
    { provide: ActivatedRoute, useValue: { params: routeParamsSubject.asObservable() } },
    { provide: Router, useValue: { navigate: jest.fn() } },
    { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
    // The real service, not a double: the component no longer provides its own, and the paging cases
    // below drive it through `updatePageIndex` and need a live `pageIndex$` to react to.
    ResourceResultService,
    { provide: ProjectPageService, useValue: { currentProject$: currentProjectSubject.asObservable() } },
    { provide: MultipleViewerService, useValue: mockMultipleViewerService },
    { provide: DataBrowserPageService, useValue: dataBrowserPageService },
    { provide: DataClassQueryService, useValue: { query$: querySubject.asObservable() } },
    { provide: SearchFilterState, useValue: { hasActiveState$: hasActiveStateSubject.asObservable() } },
    { provide: ErrorHandler, useValue: { handleError } },
    { provide: ErrorReportingService, useValue: { report } },
  ];

  beforeEach(async () => {
    routeParamsSubject = new BehaviorSubject({ [RouteConstants.classParameter]: 'TestClass' });
    currentProjectSubject = new BehaviorSubject(mockProject);
    querySubject = new BehaviorSubject(QUERY);
    hasActiveStateSubject = new BehaviorSubject(false);
    dataBrowserPageService = new DataBrowserPageService();

    mockDspApiConnection = {
      v2: {
        search: {
          doExtendedSearch: jest.fn().mockReturnValue(of({ resources: [] })),
          doExtendedSearchCountQuery: jest.fn().mockReturnValue(of({ numberOfResults: 0 })),
        },
      },
    };

    mockMultipleViewerService = {
      selectOneResource: jest.fn(),
      reset: jest.fn(),
      selectMode: false,
      selectedResources$: of([]),
    };

    handleError = jest.fn();
    report = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ResourcesListFetcherComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: makeProviders(),
    })
      .overrideComponent(ResourcesListFetcherComponent, {
        set: { template: '<div>Mock</div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourcesListFetcherComponent);
    component = fixture.componentInstance;
    component.ontologyLabel = 'testonto';
    component.classLabel = 'TestClass';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-select first resource when class has resources', async () => {
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).toHaveBeenCalledWith(mockResource1);
  });

  it('should call reset when navigating to empty class', async () => {
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 0 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.reset).toHaveBeenCalled();
  });

  /**
   * REQ-5.5. A List ⇄ Table switch destroys and recreates this fetcher, so "entry already
   * happened" cannot live on the instance: a fresh one would select its own first row over the
   * resource the user had opened in the table view they just left.
   */
  it('should not auto-select when another view already resolved the selection for this class', async () => {
    dataBrowserPageService.selectionResolvedForClass = 'TestClass';
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).not.toHaveBeenCalled();
  });

  it('should auto-select again when the resolved class is a different one', async () => {
    dataBrowserPageService.selectionResolvedForClass = 'OtherClass';
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).toHaveBeenCalledWith(mockResource1);
  });

  it('should not auto-select when selectMode is true', async () => {
    mockMultipleViewerService.selectMode = true;
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).not.toHaveBeenCalled();
  });

  /**
   * Failure-path coverage for DEV-6871. The component previously had no error handling at all, so any
   * failure left `data$` non-emitting and the template rendered the progress indicator forever.
   */
  describe('failure handling (DEV-6871)', () => {
    /** Collects every emission, unlike firstValueFrom, so the retry case can be observed. */
    const collectData = () => {
      const emitted: ({ resources: ReadResource[]; selectFirstResource: boolean } | null)[] = [];
      const sub = component.data$.subscribe(value => emitted.push(value));
      return { emitted, sub };
    };

    it('still renders the resource list when the count query fails', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(
        of({ resources: [mockResource1, mockResource2] })
      );
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(
        throwError(() => new Error('count query timed out'))
      );

      component.ngOnChanges();
      const { emitted, sub } = collectData();

      // A count failure must not take down the resource list: the count is decorative, the list is not.
      expect(emitted.at(-1)?.resources).toEqual([mockResource1, mockResource2]);
      expect(component.failed()).toBe(false);
      // Null, not the page length: substituting a wrong total would have the UI assert it as fact.
      expect(fixture.debugElement.injector.get(ResourceResultService).numberOfResults).toBeNull();
      sub.unsubscribe();
    });

    it('reports a failed count query to telemetry without notifying the user (DEV-6872)', () => {
      const error = new Error('count query timed out');
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(throwError(() => error));

      component.ngOnChanges();
      const { sub } = collectData();

      // The failure used to be swallowed outright, leaving no signal of a count-query timeout anywhere.
      expect(report).toHaveBeenCalledWith(error, {
        component: 'ResourcesListFetcherComponent',
        operation: 'gravsearchCountQuery',
      });
      // Still deliberately silent towards the user: the resource list rendered fine.
      expect(handleError).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('does not claim missing permissions when the count query fails on an empty page', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(
        throwError(() => new Error('count query timed out'))
      );

      component.ngOnChanges();
      const { emitted, sub } = collectData();

      // Assert the emission first: without it this test would also pass against the unfixed code,
      // where the count error kills the stream and the flag merely keeps its initial `true`.
      expect(emitted).toHaveLength(1);
      // An unknown count cannot support the "class has resources but none came back" inference, so it
      // must never render the no-permissions message.
      expect(component.userCanViewResources).toBe(true);
      sub.unsubscribe();
    });

    it('still reports missing permissions when the count succeeds and reports hidden resources', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 5 }));

      component.ngOnChanges();
      const { sub } = collectData();

      // The inference itself must survive the rewrite that made the count nullable.
      expect(component.userCanViewResources).toBe(false);
      sub.unsubscribe();
    });

    it('stops the spinner and raises the failure state when the resource query fails', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(
        throwError(() => new Error('500 from the triplestore'))
      );

      component.ngOnChanges();
      const { emitted, sub } = collectData();

      // The regression this guards: with no catchError, data$ never emitted and the template's @else
      // branch kept the progress indicator on screen indefinitely.
      expect(component.failed()).toBe(true);
      expect(emitted.at(-1)).toBeNull();
      expect(handleError).toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('clears a previously known count when a later page request fails', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 1000 }));

      component.ngOnChanges();
      const { sub } = collectData();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      expect(resourceResult.numberOfResults).toBe(1000);

      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(throwError(() => new Error('page 2 timed out')));
      resourceResult.updatePageIndex(1);

      // Leaving 1000 here would have the service report a total for resources that are no longer on
      // screen, contradicting its own "null means genuinely unknown" contract.
      expect(component.failed()).toBe(true);
      expect(resourceResult.numberOfResults).toBeNull();
      sub.unsubscribe();
    });

    it('re-runs the load when the failure state is retried', () => {
      mockDspApiConnection.v2.search.doExtendedSearch
        .mockReturnValueOnce(throwError(() => new Error('transient failure')))
        .mockReturnValue(of({ resources: [mockResource1] }));

      component.ngOnChanges();
      const { emitted, sub } = collectData();
      expect(component.failed()).toBe(true);

      component.onRetry();

      expect(component.failed()).toBe(false);
      expect(emitted.at(-1)?.resources).toEqual([mockResource1]);
      sub.unsubscribe();
    });
  });

  /**
   * The Data tab's query now arrives from the URL rather than being assembled here, which makes the
   * query a *trigger*. These cover what that changes: paging relative to the query, what a retry is
   * allowed to forget, and the offset splice that a fulltext term can now reach.
   */
  describe('query-driven re-querying (DEV-7453)', () => {
    const lastQuery = () => mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.at(-1)[0] as string;

    /** `data$` is built in `ngOnChanges`, so every case has to go through it before subscribing. */
    const start = () => {
      component.ngOnChanges();
      return component.data$.subscribe();
    };

    it('returns to page 0 when the query changes', () => {
      const sub = start();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      resourceResult.updatePageIndex(3);

      querySubject.next(`${QUERY} FILTER(?x)`);

      // Page 4 of the previous result set is meaningless against a narrower one, and leaving the
      // offset would land the user on an empty page of a filter that does have matches.
      expect(lastQuery()).toContain('OFFSET 0');
      sub.unsubscribe();
    });

    it('keeps the page index across a retry', () => {
      const sub = start();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      resourceResult.updatePageIndex(2);
      expect(lastQuery()).toContain('OFFSET 2');

      component.onRetry();

      // A retry repeats the request that failed. Silently returning to page 1 would lose the user's
      // place in a list they were already deep into.
      expect(lastQuery()).toContain('OFFSET 2');
      sub.unsubscribe();
    });

    it('splices the offset at the last OFFSET, not the first', () => {
      // A fulltext term is interpolated into the query, so the word can appear inside a FILTER long
      // before the real offset clause. Cutting at the first occurrence truncated the query mid-clause
      // and sent the server something syntactically broken.
      querySubject.next('CONSTRUCT { ?x ?y ?z } WHERE { FILTER regex(?label, "OFFSET") }\nOFFSET 0');
      const sub = start();

      expect(lastQuery()).toContain('regex(?label, "OFFSET")');
      expect(lastQuery()).toMatch(/OFFSET 0$/);
      sub.unsubscribe();
    });

    it('scopes both the result and the count query to the current project', () => {
      const sub = start();

      expect(mockDspApiConnection.v2.search.doExtendedSearch).toHaveBeenCalledWith(
        expect.any(String),
        'http://rdfh.ch/projects/0001'
      );
      expect(mockDspApiConnection.v2.search.doExtendedSearchCountQuery).toHaveBeenCalledWith(
        expect.any(String),
        'http://rdfh.ch/projects/0001'
      );
      sub.unsubscribe();
    });

    it('leaves the viewer alone when a filter change empties the list', () => {
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1] }));
      const sub = start();
      expect(mockMultipleViewerService.selectOneResource).toHaveBeenCalledWith(mockResource1);

      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      querySubject.next(`${QUERY} FILTER(?narrow)`);

      // Entry behaviour only. Widening the filter again should find the user's resource still open,
      // so a filter-driven empty result must not clear the viewer (REQ-2.8).
      expect(mockMultipleViewerService.reset).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('reloads when the panel reports a newly created resource', () => {
      const sub = start();
      const callsBefore = mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.length;

      dataBrowserPageService.reloadNavigation();

      // Creating a resource adds a row this list cannot predict. Losing this trigger is silent — the
      // list simply does not show the resource the user just created, and every other test passes.
      expect(mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.length).toBeGreaterThan(callsBefore);
      sub.unsubscribe();
    });

    it('does not run the initial load twice for the replayed reload value', () => {
      const sub = start();

      // `onNavigationReload$` is a BehaviorSubject, so it replays on subscribe. Without skip(1) that
      // replay fires a second full load on every mount.
      expect(mockDspApiConnection.v2.search.doExtendedSearch).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('shows the empty state rather than the permissions panel while filters are active', () => {
      hasActiveStateSubject.next(true);
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 5 }));

      const sub = start();

      // Zero results is the expected outcome of narrowing, not evidence of hidden resources — the
      // "class has resources but none came back" inference does not hold once a filter is on.
      expect(component.userCanViewResources).toBe(true);
      sub.unsubscribe();
    });
  });

  /**
   * The suites above replace the template, so `(retry)="onRetry()"` is never exercised and a broken
   * binding would pass every one of them. This component has no stories, so the real template is
   * mounted here instead to cover the click path end to end.
   */
  describe('retry binding with the real template (DEV-6871)', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ResourcesListFetcherComponent, TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: makeProviders(),
      }).compileComponents();

      fixture = TestBed.createComponent(ResourcesListFetcherComponent);
      component = fixture.componentInstance;
      component.ontologyLabel = 'testonto';
      component.classLabel = 'TestClass';
    });

    it('re-issues the request when the rendered Retry button is clicked', () => {
      // The retry is left failing on purpose. A succeeding retry would render the real resource list,
      // dragging ProjectShortnameService and the generated OpenAPI client into this test; the binding
      // is what is under test here, and "the request was issued again" proves it.
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(throwError(() => new Error('still failing')));

      component.ngOnChanges();
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('[data-cy="search-failed-retry"]') as HTMLButtonElement;
      expect(retryButton).not.toBeNull();
      expect(mockDspApiConnection.v2.search.doExtendedSearch).toHaveBeenCalledTimes(1);

      retryButton.click();
      fixture.detectChanges();

      expect(mockDspApiConnection.v2.search.doExtendedSearch).toHaveBeenCalledTimes(2);
      expect(component.failed()).toBe(true);
    });
  });
});
