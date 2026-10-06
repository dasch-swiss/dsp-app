import { ErrorHandler, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService } from '@dasch-swiss/vre/core/error-handler';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { SearchFlowLogger } from '@dasch-swiss/vre/pages/search/search-filters';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdvancedSearchResultsComponent } from '../advanced-search-results.component';

describe('AdvancedSearchResultsComponent', () => {
  const projectIri = 'http://rdfh.ch/projects/0001';
  // A minimal generated query with a trailing paging clause, as the derived state produces it.
  const query =
    'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\nWHERE { }\nORDER BY ASC(?label)\nOFFSET 0';
  let doExtendedSearch: jest.Mock;
  let doExtendedSearchCountQuery: jest.Mock;
  let handleError: jest.Mock;
  let report: jest.Mock;

  beforeEach(() => {
    doExtendedSearch = jest.fn().mockReturnValue(of({ resources: [] }));
    doExtendedSearchCountQuery = jest.fn().mockReturnValue(of({ numberOfResults: 0 }));
    handleError = jest.fn();
    report = jest.fn();

    TestBed.configureTestingModule({
      imports: [AdvancedSearchResultsComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { search: { doExtendedSearch, doExtendedSearchCountQuery } } },
        },
        { provide: ProjectPageService, useValue: { currentProject: { id: projectIri } } },
        {
          provide: SearchFlowLogger,
          useValue: { searchStart: jest.fn(), searchSuccess: jest.fn(), searchError: jest.fn() },
        },
        { provide: Title, useValue: { setTitle: jest.fn() } },
        { provide: ErrorHandler, useValue: { handleError } },
        { provide: ErrorReportingService, useValue: { report } },
      ],
    });
    TestBed.overrideComponent(AdvancedSearchResultsComponent, { set: { template: '', imports: [] } });
  });

  /** Set by renderComponent, so tests can reach the component's own ResourceResultService instance. */
  let fixture: ComponentFixture<AdvancedSearchResultsComponent>;

  const renderComponent = (withQuery = query) => {
    fixture = TestBed.createComponent(AdvancedSearchResultsComponent);
    const component = fixture.componentInstance;
    component.query = withQuery;
    component.ngOnChanges({ query: new SimpleChange(undefined, withQuery, true) });
    return component;
  };

  /**
   * Focused coverage for REQ-3.2: every extended-search request AND its count twin must carry the
   * current project IRI as `limitToProject`. Renders with an empty template (the real child components
   * are irrelevant here) and asserts the two dsp-js calls receive the project IRI.
   */
  describe('project scoping (REQ-3.2)', () => {
    it('forwards the current project IRI as limitToProject to both the search and count calls', () => {
      const component = renderComponent();

      const sub = component.resources$.subscribe();

      expect(doExtendedSearch).toHaveBeenCalledWith(expect.stringContaining('OFFSET 0'), projectIri);
      expect(doExtendedSearchCountQuery).toHaveBeenCalledWith(expect.stringContaining('OFFSET 0'), projectIri);
      sub.unsubscribe();
    });

    it('strips only the trailing paging clause even when the query embeds the substring "OFFSET"', () => {
      // A fulltext term containing "OFFSET" is embedded in matchFulltext(?mainRes, "…"); _getQuery must
      // cut at the final OFFSET, not the one inside the literal, so the emitted query stays well-formed.
      const trickyQuery =
        'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
        'WHERE {\n  FILTER knora-api:matchFulltext(?mainRes, "OFFSET war") .\n}\nORDER BY ASC(?label)\nOFFSET 0';
      const component = renderComponent(trickyQuery);

      const sub = component.resources$.subscribe();

      const sentQuery = doExtendedSearch.mock.calls[0][0] as string;
      // The literal survives intact; the paging clause was appended fresh.
      expect(sentQuery).toContain('matchFulltext(?mainRes, "OFFSET war")');
      expect(sentQuery.trimEnd().endsWith('OFFSET 0')).toBe(true);
      sub.unsubscribe();
    });
  });

  /**
   * Failure-path coverage for DEV-6866. A failed query used to recover with `of([])`, which rendered
   * the "no results found" empty state and told the user their search legitimately matched nothing
   * when in fact it never completed.
   */
  describe('search failure handling (DEV-6866)', () => {
    const resource = { id: 'http://rdfh.ch/0001/res1', label: 'Test Resource' } as ReadResource;

    it('raises the failure state rather than emitting an empty result set when the query fails', () => {
      doExtendedSearch.mockReturnValue(throwError(() => new Error('500 from the triplestore')));
      const component = renderComponent();

      const emitted: (ReadResource[] | null)[] = [];
      const sub = component.resources$.subscribe(value => emitted.push(value));

      expect(component.failed()).toBe(true);
      expect(component.queryIsExecuting()).toBe(false);
      // An empty array would render the no-results state, which is the regression this guards.
      expect(emitted).not.toContainEqual([]);
      expect(handleError).toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('renders the results when the count query fails, reporting the count as unknown', () => {
      doExtendedSearch.mockReturnValue(of({ resources: [resource] }));
      doExtendedSearchCountQuery.mockReturnValue(throwError(() => new Error('count query timed out')));
      const component = renderComponent();

      const emitted: (ReadResource[] | null)[] = [];
      const sub = component.resources$.subscribe(value => emitted.push(value));

      expect(emitted.at(-1)).toEqual([resource]);
      expect(component.failed()).toBe(false);
      // Null, not the page length: substituting a wrong total would have the UI assert it as fact.
      // Read the component's own instance — it declares providers: [ResourceResultService].
      expect(fixture.debugElement.injector.get(ResourceResultService).numberOfResults).toBeNull();
      sub.unsubscribe();
    });

    it('reports a failed count query to telemetry without notifying the user (DEV-6872)', () => {
      const error = new Error('count query timed out');
      doExtendedSearch.mockReturnValue(of({ resources: [resource] }));
      doExtendedSearchCountQuery.mockReturnValue(throwError(() => error));
      const component = renderComponent();

      const sub = component.resources$.subscribe();

      // Previously this only reached the isDevMode()-gated SearchFlowLogger, so in production the
      // failure left no trace at all.
      expect(report).toHaveBeenCalledWith(error, {
        component: 'AdvancedSearchResultsComponent',
        operation: 'gravsearchCountQuery',
      });
      // Still deliberately silent towards the user: the result list rendered fine.
      expect(handleError).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('clears a previously known count when a later page request fails', () => {
      doExtendedSearch.mockReturnValue(of({ resources: [resource] }));
      doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 1000 }));
      const component = renderComponent();
      const resourceResult = fixture.debugElement.injector.get(ResourceResultService);

      const sub = component.resources$.subscribe();
      expect(resourceResult.numberOfResults).toBe(1000);

      doExtendedSearch.mockReturnValue(throwError(() => new Error('page 2 timed out')));
      resourceResult.updatePageIndex(1);

      // Leaving 1000 here would have the service report a total for results that are no longer on
      // screen, contradicting its own "null means genuinely unknown" contract.
      expect(component.failed()).toBe(true);
      expect(resourceResult.numberOfResults).toBeNull();
      sub.unsubscribe();
    });

    it('re-runs the query when the failure state is retried', () => {
      doExtendedSearch
        .mockReturnValueOnce(throwError(() => new Error('transient failure')))
        .mockReturnValue(of({ resources: [resource] }));
      const component = renderComponent();

      const emitted: (ReadResource[] | null)[] = [];
      const sub = component.resources$.subscribe(value => emitted.push(value));
      expect(component.failed()).toBe(true);

      component.onRetry();

      expect(component.failed()).toBe(false);
      expect(emitted.at(-1)).toEqual([resource]);
      expect(doExtendedSearch).toHaveBeenCalledTimes(2);
      sub.unsubscribe();
    });
  });
});
