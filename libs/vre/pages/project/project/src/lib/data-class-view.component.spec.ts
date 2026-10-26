import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { StatementDraftStore } from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, NEVER } from 'rxjs';
import { DataClassUrlStateService, DataClassView } from './data-class-url-state.service';
import { DataClassViewComponent } from './data-class-view.component';
import { ProjectPageService } from './project-page.service';

const windowOf = (initialWidth: number) => {
  let width = initialWidth;
  const changes = new BehaviorSubject<BreakpointState>({ matches: true, breakpoints: {} });
  const observer: Partial<BreakpointObserver> = {
    isMatched: (query: string | readonly string[]) =>
      [query].flat().every(single => width >= Number(/min-width:\s*(\d+)px/.exec(single)?.[1])),
    observe: () => changes.asObservable(),
  };
  return {
    observer,
    resizeTo: (newWidth: number) => {
      width = newWidth;
      changes.next({ matches: true, breakpoints: {} });
    },
  };
};

const viewIn = (window: ReturnType<typeof windowOf>, view: DataClassView = 'list'): DataClassViewComponent => {
  const urlState = { view$: new BehaviorSubject<DataClassView>(view), reset: () => {} };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: BreakpointObserver, useValue: window.observer },
      { provide: DataClassUrlStateService, useValue: urlState },
      { provide: MultipleViewerService, useValue: { selectedResources$: NEVER } },
    ],
  });
  const projectPageService = { currentProject$: NEVER, ontologies$: NEVER } as unknown as ProjectPageService;
  const route = { params: NEVER } as unknown as ActivatedRoute;
  return TestBed.runInInjectionContext(
    () =>
      new DataClassViewComponent(
        projectPageService,
        route,
        {} as OntologyService,
        urlState as unknown as DataClassUrlStateService,
        { discardDrafts: () => {} } as unknown as StatementDraftStore
      )
  );
};

describe('DataClassViewComponent', () => {
  describe('result list width per breakpoint', () => {
    it.each([
      [767, 300],
      [1279, 300],
      [1280, 360],
      [1535, 360],
      [1536, 380],
      [1919, 380],
      [1920, 400],
      [2559, 400],
      [2560, 440],
      [3840, 440],
    ])('on a %ipx window it is %ipx wide', (windowWidth, expected) => {
      expect(viewIn(windowOf(windowWidth)).resultListWidth()).toBe(expected);
    });

    it('follows the window across breakpoints until the user drags it', () => {
      const window = windowOf(1600);
      const view = viewIn(window);

      window.resizeTo(2000);
      expect(view.resultListWidth()).toBe(400);

      view.onResultListDragged({ gutterNum: 1, sizes: [812, '*'] });
      expect(view.resultListWidth()).toBe(812);

      window.resizeTo(1300);
      expect(view.resultListWidth()).toBe(812);
      window.resizeTo(2600);
      expect(view.resultListWidth()).toBe(812);
    });
  });

  describe('split sizes', () => {
    it('gives the list its breakpoint width and the viewer the rest in list view', () => {
      const view = viewIn(windowOf(1600));
      expect(view.panelSize()).toBe(380);
      expect(view.viewerSize()).toBe('*');
    });

    it('gives the list the whole width in table view, where the viewer is hidden', () => {
      const view = viewIn(windowOf(1600), 'table');
      expect(view.panelSize()).toBe('*');
      expect(view.viewerIsVisible()).toBe(false);
    });
  });
});
