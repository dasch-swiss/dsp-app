import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { BulkEditLauncher, MultipleViewerService, ResourceClassCountApi } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DataClassQueryService } from './data-class-query.service';
import { DataClassResultsBarComponent } from './data-class-results-bar.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DownloadDialogComponent } from './download/download-dialog.component';
import { ProjectPageService } from './project-page.service';

describe('DataClassResultsBarComponent', () => {
  const resClass = {
    id: 'http://example.org/ontology/ResourceClass',
    labels: [{ language: 'en', value: 'Test Resource Class' }],
  } as unknown as ResourceClassDefinitionWithAllLanguages;

  const property = (id: string, guiOrder: number, overrides: Record<string, unknown> = {}) => ({
    propertyIndex: id,
    guiOrder,
    propertyDefinition: { id, isEditable: true, isLinkProperty: false, subPropertyOf: [], ...overrides },
  });

  // Class definition as the ontology cache returns it: editable, non-editable and link properties.
  const classDefinitions = {
    classes: {
      [resClass.id]: {
        id: resClass.id,
        getResourcePropertiesList: () => [
          property('prop:date', 2),
          property('prop:title', 1),
          property('prop:creator', 3, { isEditable: false }),
          property('prop:linksTo', 4, { isLinkProperty: true }),
        ],
      },
    },
  };

  let dialog: { open: jest.Mock };
  let classCountApi: { getResourceClassCount: jest.Mock };
  let term$: BehaviorSubject<string>;
  let filters$: BehaviorSubject<unknown[]>;
  let doExtendedSearch: jest.Mock;
  let launcher: { open: jest.Mock };
  let notification: { openSnackBar: jest.Mock };
  let multipleViewer: { selectedResources$: unknown; selectMode: boolean; notifyResourceChanged: jest.Mock };

  /** One result page per call: the OFFSET in the query is the page index. */
  const pageOf = (query: string) => {
    const pageIndex = Number(/OFFSET (\d+)$/.exec(query)?.[1]);
    return of({ resources: [{ id: `iri-${pageIndex}-a` }, { id: `iri-${pageIndex}-b` }] });
  };

  const create = () => {
    const component = TestBed.createComponent(DataClassResultsBarComponent).componentInstance;
    component.classSelected = { resClass };
    return component;
  };

  beforeEach(() => {
    dialog = { open: jest.fn() };
    classCountApi = { getResourceClassCount: jest.fn().mockReturnValue(of(66)) };
    term$ = new BehaviorSubject('');
    filters$ = new BehaviorSubject<unknown[]>([]);
    doExtendedSearch = jest.fn(pageOf);
    launcher = { open: jest.fn().mockReturnValue(of(['iri-0-a'])) };
    notification = { openSnackBar: jest.fn() };
    multipleViewer = { selectedResources$: of([]), selectMode: false, notifyResourceChanged: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DataClassResultsBarComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: dialog },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              ontologyCache: { getResourceClassDefinition: () => of(classDefinitions) },
              search: { doExtendedSearch },
            },
          },
        },
        { provide: DataClassQueryService, useValue: { query$: of('CONSTRUCT {} WHERE {} OFFSET 0') } },
        {
          provide: ProjectPageService,
          useValue: { currentProject: { id: 'http://rdfh.ch/projects/0001' }, hasProjectMemberRights$: of(true) },
        },
        { provide: BulkEditLauncher, useValue: launcher },
        { provide: NotificationService, useValue: notification },
        { provide: ResourceClassCountApi, useValue: classCountApi },
        { provide: DataClassUrlStateService, useValue: { fulltextTerm$: term$, filters$ } },
        { provide: MultipleViewerService, useValue: multipleViewer },
        ResourceResultService,
        provideTranslateService(),
      ],
    }).overrideComponent(DataClassResultsBarComponent, {
      set: {
        template: '',
        providers: [{ provide: StringifyStringLiteralPipe, useValue: { transform: () => 'Test Resource Class' } }],
      },
    });
  });

  describe('narrowed$', () => {
    it('is false with neither search nor filters, and a sort does not count', () => {
      const emitted: boolean[] = [];
      create().narrowed$.subscribe(value => emitted.push(value));
      expect(emitted).toEqual([false]);
    });

    it('is true with a search term or a filter', () => {
      const emitted: boolean[] = [];
      create().narrowed$.subscribe(value => emitted.push(value));
      term$.next('Brief');
      term$.next('');
      filters$.next([{}]);
      expect(emitted).toEqual([false, true, false, true]);
    });
  });

  describe('download scope', () => {
    it('exposes the class total for the Download all badge', () => {
      const emitted: (number | null)[] = [];
      create().classCount$.subscribe(count => emitted.push(count));
      expect(classCountApi.getResourceClassCount).toHaveBeenCalledWith(resClass.id);
      expect(emitted).toEqual([null, 66]);
    });
  });

  describe('download', () => {
    it('opens the download dialog as a side panel', () => {
      create().download(10, 'class');
      expect(dialog.open).toHaveBeenCalledWith(
        DownloadDialogComponent,
        // A full-height right-side panel keeps the actions visible while only the property list scrolls.
        expect.objectContaining({ width: '600px', height: 'calc(100vh)', position: { right: '0px' } })
      );
    });

    it('passes the count, its scope and the class to the dialog', () => {
      create().download(2, 'selection', [{ id: 'iri-a' }, { id: 'iri-b' }] as ReadResource[]);
      const config = dialog.open.mock.calls[0][1];
      expect(config.data.resourceCount).toBe(2);
      expect(config.data.scope).toBe('selection');
      expect(config.data.resClass).toBe(resClass);
      expect(config.data.classLabel).toBe('Test Resource Class');
    });

    it('exports the whole class without resource IRIs', () => {
      create().download(66, 'class');
      expect(dialog.open.mock.calls[0][1].data.resourceIris).toBeUndefined();
      expect(doExtendedSearch).not.toHaveBeenCalled();
    });

    it('exports the ticked rows by their IRIs', () => {
      create().download(2, 'selection', [{ id: 'iri-a' }, { id: 'iri-b' }] as ReadResource[]);
      expect(dialog.open.mock.calls[0][1].data.resourceIris).toEqual(['iri-a', 'iri-b']);
      expect(doExtendedSearch).not.toHaveBeenCalled();
    });

    it('reads every result page and exports all matches, in result order', () => {
      const component = create();

      // 30 results: two pages of 25.
      component.download(30, 'search');

      const config = dialog.open.mock.calls[0][1];
      expect(config.data.scope).toBe('search');
      expect(config.data.resourceIris).toEqual(['iri-0-a', 'iri-0-b', 'iri-1-a', 'iri-1-b']);
      expect(config.data.resourceCount).toBe(4);
      expect(component.collecting()).toBeNull();
    });

    it('refuses a search larger than the export accepts, without reading it', () => {
      create().download(10_001, 'search');
      expect(doExtendedSearch).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
      expect(notification.openSnackBar).toHaveBeenCalledWith(expect.any(String), 'error');
    });

    it('reports a failed page and opens no dialog', () => {
      doExtendedSearch.mockReturnValueOnce(throwError(() => new Error('500')));
      const component = create();

      component.download(30, 'search');

      expect(dialog.open).not.toHaveBeenCalled();
      expect(notification.openSnackBar).toHaveBeenCalledWith(expect.any(String), 'error');
      expect(component.collecting()).toBeNull();
    });

    it('lists the editable properties of the class, not of a selected resource', () => {
      create().download(10, 'class');
      const config = dialog.open.mock.calls[0][1];
      expect(config.data.properties.map((p: { propDef: { id: string } }) => p.propDef.id)).toEqual([
        'prop:title',
        'prop:date',
      ]);
    });
  });

  describe('bulkEditAll', () => {
    it('reads every result page and opens the panel on all matches, in result order', () => {
      const component = create();
      const emitted: void[] = [];
      component.bulkEdited.subscribe(() => emitted.push(undefined));

      // 51 results: three pages of 25.
      component.bulkEditAll(51, true);

      expect(doExtendedSearch.mock.calls.map(([query]) => query.match(/OFFSET \d+$/)?.[0])).toEqual([
        'OFFSET 0',
        'OFFSET 1',
        'OFFSET 2',
      ]);
      expect(doExtendedSearch).toHaveBeenCalledWith(expect.any(String), 'http://rdfh.ch/projects/0001');
      expect(launcher.open).toHaveBeenCalledWith(
        ['iri-0-a', 'iri-0-b', 'iri-1-a', 'iri-1-b', 'iri-2-a', 'iri-2-b'],
        'pages.dataBrowser.resultsBar.bulkEditScopeFiltered'
      );
      expect(multipleViewer.notifyResourceChanged).toHaveBeenCalledWith('iri-0-a');
      expect(component.collecting()).toBeNull();
      expect(emitted).toHaveLength(1);
    });

    it('reports a failed page and opens nothing', () => {
      doExtendedSearch.mockReturnValueOnce(throwError(() => new Error('500')));
      const component = create();

      component.bulkEditAll(30, false);

      expect(launcher.open).not.toHaveBeenCalled();
      expect(notification.openSnackBar).toHaveBeenCalledWith(expect.any(String), 'error');
      expect(component.collecting()).toBeNull();
    });
  });
});
