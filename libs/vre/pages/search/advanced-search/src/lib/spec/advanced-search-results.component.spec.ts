import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdvancedSearchResultsComponent } from '../advanced-search-results.component';
import { SearchFlowLogger } from '../service/search-flow-logger.service';

/**
 * Focused coverage for REQ-3.2: every extended-search request AND its count twin must carry the
 * current project IRI as `limitToProject`. Renders with an empty template (the real child components
 * are irrelevant here) and asserts the two dsp-js calls receive the project IRI.
 */
describe('AdvancedSearchResultsComponent — project scoping (REQ-3.2)', () => {
  const projectIri = 'http://rdfh.ch/projects/0001';
  // A minimal generated query with a trailing paging clause, as the derived state produces it.
  const query =
    'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\nWHERE { }\nORDER BY ASC(?label)\nOFFSET 0';
  let doExtendedSearch: jest.Mock;
  let doExtendedSearchCountQuery: jest.Mock;

  beforeEach(() => {
    doExtendedSearch = jest.fn().mockReturnValue(of({ resources: [] }));
    doExtendedSearchCountQuery = jest.fn().mockReturnValue(of({ numberOfResults: 0 }));

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
      ],
    });
    TestBed.overrideComponent(AdvancedSearchResultsComponent, { set: { template: '', imports: [] } });
  });

  it('forwards the current project IRI as limitToProject to both the search and count calls', () => {
    const fixture = TestBed.createComponent(AdvancedSearchResultsComponent);
    const component = fixture.componentInstance;
    component.query = query;
    component.ngOnChanges({ query: new SimpleChange(undefined, query, true) });

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
    const fixture = TestBed.createComponent(AdvancedSearchResultsComponent);
    const component = fixture.componentInstance;
    component.query = trickyQuery;
    component.ngOnChanges({ query: new SimpleChange(undefined, trickyQuery, true) });

    const sub = component.resources$.subscribe();

    const sentQuery = doExtendedSearch.mock.calls[0][0] as string;
    // The literal survives intact; the paging clause was appended fresh.
    expect(sentQuery).toContain('matchFulltext(?mainRes, "OFFSET war")');
    expect(sentQuery.trimEnd().endsWith('OFFSET 0')).toBe(true);
    sub.unsubscribe();
  });
});
