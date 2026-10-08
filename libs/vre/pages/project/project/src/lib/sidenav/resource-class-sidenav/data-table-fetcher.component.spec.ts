import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Cardinality,
  Constants,
  ReadOntology,
  ReadProject,
  ReadResource,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService } from '@dasch-swiss/vre/core/error-handler';
import {
  IMAGE_COLUMN_KEY,
  LABEL_COLUMN_KEY,
  MultipleViewerService,
  RIGHTS_COLUMN_KEYS,
  TableViewStateService,
} from '@dasch-swiss/vre/pages/data-browser';
import {
  FilterEditorRequestService,
  RDFS_LABEL,
  SearchFilterState,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { ProjectDataRightsService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { DataClassQueryService } from '../../data-class-query.service';
import { DataClassUrlStateService } from '../../data-class-url-state.service';
import { ProjectPageService } from '../../project-page.service';
import { DataTableFetcherComponent } from './data-table-fetcher.component';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/anything/v2#';
const TITLE = `${ONTO}hasTitle`;
const PLACE = `${ONTO}hasPlace`;

const QUERY = 'CONSTRUCT { ?mainRes knora-api:isMainResource true . } WHERE { ?mainRes a <C> . }\nOFFSET 0';

function propDef(id: string, label: string, guiOrder?: number): ResourcePropertyDefinitionWithAllLanguages {
  return {
    id,
    labels: [{ language: 'en', value: label }],
    objectType: Constants.TextValue,
    isEditable: true,
    isLinkProperty: false,
    isLinkValueProperty: false,
    subPropertyOf: [],
    guiOrder,
  } as unknown as ResourcePropertyDefinitionWithAllLanguages;
}

const DEFINITIONS = [propDef(TITLE, 'Title'), propDef(PLACE, 'Place')];

/** Only what the column model reads: the definitions, by type. */
const ONTOLOGY = { getPropertyDefinitionsByType: () => DEFINITIONS } as unknown as ReadOntology;

function resClass(withImage = false): ResourceClassDefinitionWithAllLanguages {
  return {
    id: `${ONTO}Thing`,
    propertiesList: [
      { propertyIndex: TITLE, cardinality: Cardinality._0_1, guiOrder: 1 },
      { propertyIndex: PLACE, cardinality: Cardinality._0_1, guiOrder: 2 },
      ...(withImage ? [{ propertyIndex: Constants.HasStillImageFileValue, cardinality: Cardinality._1 }] : []),
    ],
  } as unknown as ResourceClassDefinitionWithAllLanguages;
}

function resource(id: string): ReadResource {
  return { id, label: id } as ReadResource;
}

describe('DataTableFetcherComponent', () => {
  let fixture: ComponentFixture<DataTableFetcherComponent>;
  let component: DataTableFetcherComponent;
  let api: {
    v2: {
      search: { doExtendedSearch: jest.Mock; doExtendedSearchCountQuery: jest.Mock };
      res: { getResources: jest.Mock };
    };
  };
  let querySubject: BehaviorSubject<string>;
  let filtersSubject: BehaviorSubject<{ predicateIri: string; parentIndex?: number | null }[]>;
  let sortPredicateSubject: BehaviorSubject<string>;
  let multipleViewer: {
    selectedResources$: BehaviorSubject<ReadResource[]>;
    selectMode: boolean;
    addResources: jest.Mock;
    removeResources: jest.Mock;
    notifyResourceChanged: jest.Mock;
  };
  let urlState: { setSort: jest.Mock };
  let filterEditor: { open: jest.Mock };
  let dataRights: { fromProject: jest.Mock };
  let handleError: jest.Mock;
  let report: jest.Mock;
  let resourceResult: ResourceResultService;

  const RIGHTS = {
    licenseLabel: 'CC BY 4.0',
    copyrightHolder: 'DaSCH',
    defaultDataAuthorship: [],
    isPlaceholderLicense: false,
    isPlaceholderCopyrightHolder: false,
  };

  beforeEach(async () => {
    localStorage.clear();
    querySubject = new BehaviorSubject(QUERY);
    filtersSubject = new BehaviorSubject<{ predicateIri: string; parentIndex?: number | null }[]>([]);
    sortPredicateSubject = new BehaviorSubject(RDFS_LABEL);
    api = {
      v2: {
        search: {
          doExtendedSearch: jest.fn().mockReturnValue(of({ resources: [resource('a'), resource('b')] })),
          doExtendedSearchCountQuery: jest.fn().mockReturnValue(of({ numberOfResults: 2 })),
        },
        res: {
          // The batch fetch, which echoes back whatever IRIs it is asked for.
          getResources: jest.fn((iris: string[]) => of(iris.map(resource))),
        },
      },
    };
    multipleViewer = {
      selectedResources$: new BehaviorSubject<ReadResource[]>([]),
      selectMode: false,
      addResources: jest.fn(),
      removeResources: jest.fn(),
      notifyResourceChanged: jest.fn(),
    };
    urlState = { setSort: jest.fn() };
    filterEditor = { open: jest.fn() };
    dataRights = { fromProject: jest.fn().mockReturnValue(of(RIGHTS)) };
    handleError = jest.fn();
    report = jest.fn();

    await TestBed.configureTestingModule({
      imports: [DataTableFetcherComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: DspApiConnectionToken, useValue: api },
        { provide: MultipleViewerService, useValue: multipleViewer },
        DataBrowserPageService,
        ResourceResultService,
        { provide: DataClassQueryService, useValue: { query$: querySubject.asObservable() } },
        {
          provide: SearchFilterState,
          useValue: { hasActiveState$: of(false), filters$: filtersSubject.asObservable() },
        },
        { provide: FilterEditorRequestService, useValue: filterEditor },
        {
          provide: DataClassUrlStateService,
          useValue: { ...urlState, sortPredicateIri$: sortPredicateSubject.asObservable(), sortDescending$: of(false) },
        },
        {
          provide: StringifyStringLiteralPipe,
          useValue: { transform: (labels: { value: string }[]) => labels[0]?.value ?? '' },
        },
        { provide: ErrorHandler, useValue: { handleError } },
        { provide: ErrorReportingService, useValue: { report } },
        {
          provide: ProjectPageService,
          useValue: { currentProject$: of({ id: 'http://rdfh.ch/projects/0001', shortcode: '0001' } as ReadProject) },
        },
        { provide: ProjectDataRightsService, useValue: dataRights },
      ],
    })
      .overrideComponent(DataTableFetcherComponent, { set: { template: '<div>Mock</div>' } })
      .compileComponents();
  });

  /** Inputs, then `ngOnChanges`, which builds the columns and `data$`. */
  const create = (withImage = false) => {
    fixture = TestBed.createComponent(DataTableFetcherComponent);
    component = fixture.componentInstance;
    component.ontologyLabel = 'anything';
    component.classLabel = 'Thing';
    component.ontology = ONTOLOGY;
    component.resClass = resClass(withImage);
    resourceResult = fixture.debugElement.injector.get(ResourceResultService);
    component.ngOnChanges();
  };

  /** Every `data$` emission, for as long as the subscription is held. */
  const collect = () => {
    const emitted: ({ resources: ReadResource[] } | null)[] = [];
    const sub = component.data$.subscribe(value => emitted.push(value));
    return { emitted, sub };
  };

  const ids = (value: { resources: ReadResource[] } | null | undefined) => value?.resources.map(r => r.id);

  describe('columns', () => {
    it('PutsTheLabelFirstThenThePropertiesThenTheRightsStatement', () => {
      create();

      expect(component.columns().map(column => column.key)).toEqual([
        LABEL_COLUMN_KEY,
        TITLE,
        PLACE,
        RIGHTS_COLUMN_KEYS.license,
        RIGHTS_COLUMN_KEYS.copyrightHolder,
        RIGHTS_COLUMN_KEYS.authorship,
      ]);
    });

    /** For a class of pages or photographs the image identifies a row more than any property. */
    it('PutsAStillImageClasssImageRightAfterTheLabel', () => {
      create(true);

      expect(component.columns()[1].key).toBe(IMAGE_COLUMN_KEY);
    });

    it('ShowsEveryColumnOnAClassItHasNeverSeen', () => {
      create(true);

      expect(component.layout().visible).toEqual(component.columns().map(column => column.key));
    });

    it('UsesThePropertyLabelsAsHeaders', () => {
      create();

      expect(component.columns().find(column => column.key === TITLE)?.label).toBe('Title');
    });
  });

  describe('fetching', () => {
    /** Gravsearch only projects filtered properties, so the page is fetched again in full. */
    it('FetchesThePagesResourcesInFullInOneBatch', () => {
      create();
      const { emitted, sub } = collect();

      expect(api.v2.res.getResources).toHaveBeenCalledWith(['a', 'b']);
      expect(ids(emitted.at(-1))).toEqual(['a', 'b']);
      sub.unsubscribe();
    });

    /** The Gravsearch result is the sort the user asked for; the batch does not keep it. */
    it('KeepsTheQuerysOrderWhateverOrderTheBatchReturns', () => {
      api.v2.res.getResources.mockReturnValue(of([resource('b'), resource('a')]));
      create();
      const { emitted, sub } = collect();

      expect(ids(emitted.at(-1))).toEqual(['a', 'b']);
      sub.unsubscribe();
    });

    /** It disappeared or became unreadable between the two requests; a row with no data is worse. */
    it('DropsAResourceTheBatchDidNotReturn', () => {
      api.v2.res.getResources.mockReturnValue(of({ resources: [resource('b')] }));
      create();
      const { emitted, sub } = collect();

      expect(ids(emitted.at(-1))).toEqual(['b']);
      sub.unsubscribe();
    });

    it('SkipsTheBatchForAnEmptyPage', () => {
      api.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
      create();
      const { emitted, sub } = collect();

      expect(api.v2.res.getResources).not.toHaveBeenCalled();
      expect(emitted.at(-1)?.resources).toEqual([]);
      sub.unsubscribe();
    });

    it('PublishesTheCountForTheHeader', () => {
      api.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 4024 }));
      create();
      const { sub } = collect();

      expect(resourceResult.numberOfResults).toBe(4024);
      sub.unsubscribe();
    });

    it('SplicesThePageOffsetAtTheLastOffsetInTheQuery', () => {
      querySubject.next(`${QUERY.replace('OFFSET 0', '')} FILTER(regex(?t, "OFFSET"))\nOFFSET 0`);
      create();
      const { sub } = collect();

      resourceResult.updatePageIndex(3);

      const lastQuery = api.v2.search.doExtendedSearch.mock.calls.at(-1)[0] as string;
      expect(lastQuery).toContain('regex(?t, "OFFSET")');
      expect(lastQuery.endsWith('OFFSET 3')).toBe(true);
      sub.unsubscribe();
    });

    it('ReturnsToTheFirstPageWhenTheQueryChanges', () => {
      create();
      const { sub } = collect();
      resourceResult.updatePageIndex(3);

      querySubject.next(`${QUERY} FILTER(?x)`);

      const lastQuery = api.v2.search.doExtendedSearch.mock.calls.at(-1)[0] as string;
      expect(lastQuery.endsWith('OFFSET 0')).toBe(true);
      sub.unsubscribe();
    });
  });

  describe('failures', () => {
    /** The count re-runs the same WHERE clause; its timeout must not throw away a good page. */
    it('StillShowsTheRowsWhenTheCountFails', () => {
      api.v2.search.doExtendedSearchCountQuery.mockReturnValue(throwError(() => new Error('count timed out')));
      create();
      const { emitted, sub } = collect();

      expect(ids(emitted.at(-1))).toEqual(['a', 'b']);
      expect(resourceResult.numberOfResults).toBeNull();
      expect(report).toHaveBeenCalled();
      expect(component.failed()).toBe(false);
      sub.unsubscribe();
    });

    it('RaisesTheFailureStateWhenThePageFails', () => {
      api.v2.search.doExtendedSearch.mockReturnValue(throwError(() => new Error('500')));
      create();
      const { emitted, sub } = collect();

      expect(component.failed()).toBe(true);
      expect(emitted.at(-1)).toBeNull();
      expect(handleError).toHaveBeenCalled();
      sub.unsubscribe();
    });

    /** A failed batch means there is nothing to draw, unlike a failed count. */
    it('RaisesTheFailureStateWhenTheBatchFails', () => {
      api.v2.res.getResources.mockReturnValue(throwError(() => new Error('batch failed')));
      create();
      const { sub } = collect();

      expect(component.failed()).toBe(true);
      sub.unsubscribe();
    });

    it('LoadsAgainOnRetry', () => {
      api.v2.search.doExtendedSearch
        .mockReturnValueOnce(throwError(() => new Error('transient')))
        .mockReturnValue(of({ resources: [resource('a')] }));
      create();
      const { emitted, sub } = collect();

      component.onRetry();

      expect(component.failed()).toBe(false);
      expect(ids(emitted.at(-1))).toEqual(['a']);
      sub.unsubscribe();
    });
  });

  /** The class header's progress bar reads this: on while rows on screen are being replaced. */
  describe('refresh state', () => {
    it('DoesNotMarkTheFirstLoadAsARefresh', () => {
      api.v2.search.doExtendedSearch.mockReturnValue(new Subject());
      create();
      const { sub } = collect();

      expect(component.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });

    it('MarksAPageChangeAsARefreshUntilTheNewRowsArrive', () => {
      create();
      const { sub } = collect();
      const pending = new Subject<{ resources: ReadResource[] }>();
      api.v2.search.doExtendedSearch.mockReturnValue(pending);

      resourceResult.updatePageIndex(1);
      expect(component.isRefreshing()).toBe(true);

      pending.next({ resources: [resource('c')] });
      expect(component.isRefreshing()).toBe(false);
      sub.unsubscribe();
    });

    it('MarksAFilterChangeAsARefresh', () => {
      create();
      const { sub } = collect();
      api.v2.search.doExtendedSearch.mockReturnValue(new Subject());

      querySubject.next(`${QUERY} FILTER(?x)`);

      expect(component.isRefreshing()).toBe(true);
      sub.unsubscribe();
    });
  });

  describe('sort and filter', () => {
    /** The URL calls the label `rdfs:label`; the table calls it the synthetic label column. */
    it('SortsTheLabelColumnByRdfsLabel', () => {
      create();

      component.onSortToggled({ key: LABEL_COLUMN_KEY, descending: true });

      expect(urlState.setSort).toHaveBeenCalledWith(RDFS_LABEL, true);
    });

    it('SortsAPropertyColumnByItsIri', () => {
      create();

      component.onSortToggled({ key: TITLE, descending: false });

      expect(urlState.setSort).toHaveBeenCalledWith(TITLE, false);
    });

    it('MarksTheColumnTheUrlSortsBy', () => {
      create();
      expect(component.sortedColumnKey()).toBe(LABEL_COLUMN_KEY);

      sortPredicateSubject.next(PLACE);

      expect(component.sortedColumnKey()).toBe(PLACE);
    });

    /** A subcriterion constrains a linked resource, not a column of this table. */
    it('MarksOnlyTopLevelFiltersOnTheirColumns', () => {
      create();

      filtersSubject.next([
        { predicateIri: RDFS_LABEL, parentIndex: null },
        { predicateIri: TITLE },
        { predicateIri: PLACE, parentIndex: 0 },
      ]);

      expect([...component.filteredColumnKeys()].sort()).toEqual([LABEL_COLUMN_KEY, TITLE].sort());
    });

    /** The chip bar opens its own editor, so an existing chip is re-opened rather than doubled. */
    it('AsksTheChipBarToOpenTheColumnsFilter', () => {
      create();

      component.onFilterRequested(LABEL_COLUMN_KEY);

      expect(filterEditor.open).toHaveBeenCalledWith(RDFS_LABEL);
    });
  });

  describe('row and column gestures', () => {
    it('AddsAndRemovesATickedRowFromTheComparison', () => {
      create();
      const row = resource('a');

      component.onResourceCheckedChanged({ resource: row, checked: true });
      component.onResourceCheckedChanged({ resource: row, checked: false });

      expect(multipleViewer.addResources).toHaveBeenCalledWith([row]);
      expect(multipleViewer.removeResources).toHaveBeenCalledWith([row]);
    });

    it('ReportsAnEditedRowSoTheViewerReReadsIt', () => {
      create();

      component.onResourceReloaded(resource('a'));

      expect(multipleViewer.notifyResourceChanged).toHaveBeenCalledWith('a');
    });

    /** Shaping is a rendering decision: none of it re-runs the query (REQ-2.3). */
    it('PersistsReorderPinAndResizeWithoutReQuerying', () => {
      create();
      const { sub } = collect();
      const calls = api.v2.search.doExtendedSearch.mock.calls.length;
      const state = TestBed.inject(TableViewStateService);

      component.onColumnsReordered([LABEL_COLUMN_KEY, PLACE, TITLE]);
      component.onColumnPinToggled(TITLE);
      component.onColumnResized({ key: PLACE, width: 333 });

      expect(state.layout().pinned).toEqual([TITLE]);
      expect(state.layout().visible.slice(0, 3)).toEqual([LABEL_COLUMN_KEY, TITLE, PLACE]);
      expect(state.layout().widths[PLACE]).toBe(333);
      expect(api.v2.search.doExtendedSearch.mock.calls.length).toBe(calls);
      sub.unsubscribe();
    });
  });

  describe('project rights', () => {
    it('LoadsTheProjectsLegalInfoForTheRightsColumns', () => {
      create();

      expect(component.projectRights()).toEqual(RIGHTS);
    });

    /** The rows are what the user came for; the rights columns go without the project's fields. */
    it('LeavesTheRightsUnsetRatherThanFailWhenTheyCannotLoad', () => {
      dataRights.fromProject.mockReturnValue(throwError(() => new Error('403')));
      create();

      expect(component.projectRights()).toBeUndefined();
      expect(component.failed()).toBe(false);
    });
  });
});
