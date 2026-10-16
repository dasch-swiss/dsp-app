import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RESOURCE_DESCRIPTION_ENABLED, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService } from '@dasch-swiss/vre/core/error-handler';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { DataBrowserPageService, ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { ResourcesListFetcherComponent } from './resources-list-fetcher.component';

describe('ResourcesListFetcherComponent', () => {
  let component: ResourcesListFetcherComponent;
  let fixture: ComponentFixture<ResourcesListFetcherComponent>;
  let mockDspApiConnection: any;
  let mockResourceResult: any;
  let mockMultipleViewerService: any;
  let routeParamsSubject: BehaviorSubject<any>;
  let currentProjectSubject: BehaviorSubject<ReadProject>;
  let handleError: jest.Mock;
  let report: jest.Mock;
  let resourceDescriptionEnabled = false;

  const mockResource1 = { id: 'resource-1', label: 'Resource 1' } as ReadResource;
  const mockResource2 = { id: 'resource-2', label: 'Resource 2' } as ReadResource;
  const mockProject = { shortcode: '0001' } as ReadProject;

  /** Shared so the real-template suite below can reuse the same doubles without duplicating them. */
  const makeProviders = () => [
    { provide: ActivatedRoute, useValue: { params: routeParamsSubject.asObservable() } },
    { provide: Router, useValue: { navigate: jest.fn() } },
    { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
    { provide: ResourceResultService, useValue: mockResourceResult },
    { provide: OntologyService, useValue: { getIriBaseUrl: () => 'http://api.knora.org' } },
    { provide: ProjectPageService, useValue: { currentProject$: currentProjectSubject.asObservable() } },
    { provide: MultipleViewerService, useValue: mockMultipleViewerService },
    { provide: DataBrowserPageService, useValue: { onNavigationReload$: of(undefined) } },
    { provide: ErrorHandler, useValue: { handleError } },
    { provide: ErrorReportingService, useValue: { report } },
    { provide: RESOURCE_DESCRIPTION_ENABLED, useFactory: () => resourceDescriptionEnabled },
  ];

  beforeEach(async () => {
    routeParamsSubject = new BehaviorSubject({ [RouteConstants.classParameter]: 'TestClass' });
    currentProjectSubject = new BehaviorSubject(mockProject);

    mockDspApiConnection = {
      v2: {
        search: {
          doExtendedSearch: jest.fn().mockReturnValue(of({ resources: [] })),
          doExtendedSearchCountQuery: jest.fn().mockReturnValue(of({ numberOfResults: 0 })),
        },
      },
    };

    mockResourceResult = {
      updatePageIndex: jest.fn(),
      pageIndex$: of(0),
      numberOfResults: 0,
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
  describe('resource descriptions', () => {
    const queries = () => ({
      paged: mockDspApiConnection.v2.search.doExtendedSearch.mock.calls[0][0] as string,
      count: mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mock.calls[0][0] as string,
    });

    it('does not ask for descriptions while the feature flag is off', async () => {
      component.ngOnChanges();
      await firstValueFrom(component.data$);

      expect(queries().paged).not.toContain('hasDescription');
    });

    describe('with the feature flag on', () => {
      // beforeAll runs before the outer beforeEach creates the component.
      beforeAll(() => (resourceDescriptionEnabled = true));
      afterAll(() => (resourceDescriptionEnabled = false));

      it('fetches descriptions optionally in the paged query, and leaves the count query alone', async () => {
        component.ngOnChanges();
        await firstValueFrom(component.data$);

        const { paged, count } = queries();
        expect(paged).toContain('?mainRes knora-api:hasDescription ?description .');
        expect(paged).toContain('OPTIONAL { ?mainRes knora-api:hasDescription ?description . }');
        expect(count).not.toContain('hasDescription');
      });
    });
  });

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
      // The component provides its own ResourceResultService, so read that instance rather than the
      // module-level mock, which this component never sees.
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
