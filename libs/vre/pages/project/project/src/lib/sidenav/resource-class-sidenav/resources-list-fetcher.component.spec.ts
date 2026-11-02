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
import { BehaviorSubject, firstValueFrom, of, Subject, throwError } from 'rxjs';
import { DataClassQueryService } from '../../data-class-query.service';
import { ResourcesListFetcherComponent } from './resources-list-fetcher.component';

describe('ResourcesListFetcherComponent', () => {
  let component: ResourcesListFetcherComponent;
  let fixture: ComponentFixture<ResourcesListFetcherComponent>;
  let mockDspApiConnection: any;
  let mockMultipleViewerService: any;
  let routeParamsSubject: BehaviorSubject<any>;
  let currentProjectSubject: BehaviorSubject<ReadProject>;
  let querySubject: BehaviorSubject<string>;
  let hasActiveStateSubject: BehaviorSubject<boolean>;
  /** Real instance: the replay behaviour of the BehaviorSubject is under test. */
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
    // Real service: the paging cases need a live `pageIndex$`.
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

  /** A List/Table switch recreates the fetcher, so "entry already happened" cannot live on the instance. */
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

  describe('query-driven re-querying (DEV-7453)', () => {
    const lastQuery = () => mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.at(-1)[0] as string;

    const start = () => {
      component.ngOnChanges();
      return component.data$.subscribe();
    };

    it('returns to page 0 when the query changes', () => {
      const sub = start();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      resourceResult.updatePageIndex(3);

      querySubject.next(`${QUERY} FILTER(?x)`);

      // The old offset would land on an empty page of the narrower result set.
      expect(lastQuery()).toContain('OFFSET 0');
      sub.unsubscribe();
    });

    it('keeps the page index across a retry', () => {
      const sub = start();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      resourceResult.updatePageIndex(2);
      expect(lastQuery()).toContain('OFFSET 2');

      component.onRetry();

      // A retry repeats the failed request, not page 1.
      expect(lastQuery()).toContain('OFFSET 2');
      sub.unsubscribe();
    });

    it('splices the offset at the last OFFSET, not the first', () => {
      // A fulltext term can contain the word OFFSET before the real offset clause.
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

      // Entry behaviour only: a filter-driven empty result must not clear the viewer.
      expect(mockMultipleViewerService.reset).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('reloads when the panel reports a newly created resource', () => {
      const sub = start();
      const callsBefore = mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.length;

      dataBrowserPageService.reloadNavigation();

      // Losing this trigger is silent: the new resource would just not appear.
      expect(mockDspApiConnection.v2.search.doExtendedSearch.mock.calls.length).toBeGreaterThan(callsBefore);
      sub.unsubscribe();
    });

    it('does not run the initial load twice for the replayed reload value', () => {
      const sub = start();

      // The BehaviorSubject replays on subscribe; without skip(1) that fires a second full load.
      expect(mockDspApiConnection.v2.search.doExtendedSearch).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('shows the empty state rather than the permissions panel while filters are active', () => {
      hasActiveStateSubject.next(true);
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 5 }));

      const sub = start();

      // Zero results is the expected outcome of narrowing, not a permissions signal.
      expect(component.userCanViewResources).toBe(true);
      sub.unsubscribe();
    });
  });

  /**
   * The suites above replace the template, so `(retry)="onRetry()"` is never exercised and a broken
   * binding would pass every one of them. This component has no stories, so the real template is
   * mounted here instead to cover the click path end to end.
   */
  describe('refresh state (DEV-7466)', () => {
    let resourceResult: ResourceResultService;
    let pending: Subject<{ resources: ReadResource[] }>;

    beforeEach(() => {
      resourceResult = fixture.debugElement.injector.get(ResourceResultService);
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1] }));
      mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 100 }));
    });

    const loadThenHoldNext = () => {
      component.ngOnChanges();
      const sub = component.data$.subscribe();
      pending = new Subject();
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(pending);
      return sub;
    };

    it('does not mark the first load as a refresh', () => {
      pending = new Subject();
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(pending);

      component.ngOnChanges();
      const sub = component.data$.subscribe();

      expect(resourceResult.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });

    it('marks a page change as a refresh until the new page arrives', () => {
      const sub = loadThenHoldNext();

      resourceResult.updatePageIndex(1);
      expect(resourceResult.isRefreshing()).toBe(true);

      pending.next({ resources: [mockResource2] });
      expect(resourceResult.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });

    it('marks a query change as a refresh', () => {
      const sub = loadThenHoldNext();

      querySubject.next(`${QUERY} FILTER(?x)`);

      expect(resourceResult.isRefreshing()).toBe(true);
      sub.unsubscribe();
    });

    it('ends the refresh when the new page fails', () => {
      const sub = loadThenHoldNext();
      resourceResult.updatePageIndex(1);

      pending.error(new Error('page 2 timed out'));

      expect(resourceResult.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });

    it('does not mark a retry as a refresh', () => {
      const sub = loadThenHoldNext();
      resourceResult.updatePageIndex(1);
      pending.error(new Error('page 2 timed out'));

      pending = new Subject();
      mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(pending);
      component.onRetry();

      expect(resourceResult.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });
  });

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
