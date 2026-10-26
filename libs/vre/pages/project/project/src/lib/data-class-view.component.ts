import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  MultipleViewerComponent,
  MultipleViewerService,
  ResourceListSelectionComponent,
} from '@dasch-swiss/vre/pages/data-browser';
import { provideSearchFilters, StatementDraftStore } from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { AngularSplitModule, SplitGutterInteractionEvent } from 'angular-split';
import { combineLatest, distinctUntilChanged, EMPTY, first, map, skip } from 'rxjs';
import { DataClassHeaderComponent } from './data-class-header.component';
import { DataClassPanelComponent } from './data-class-panel.component';
import { provideDataClassSearch } from './data-class-query.service';
import { DataClassUrlStateService, DataClassView } from './data-class-url-state.service';
import { ProjectPageService } from './project-page.service';

/** The result list's default width from each breakpoint up, widest first; min-widths are the md–xxl tokens of `_responsive.scss`. */
export const RESULT_LIST_WIDTHS: readonly (readonly [minWidth: number, width: number])[] = [
  [2560, 440],
  [1920, 400],
  [1536, 380],
  [1280, 360],
];

/** Below the md breakpoint (1280). */
export const RESULT_LIST_WIDTH_BELOW_MD = 300;

const QUERIES = RESULT_LIST_WIDTHS.map(([minWidth]) => `(min-width: ${minWidth}px)`);

@Component({
  selector: 'app-data-class-view',
  template: `
    @if (data$ | async; as classSelected) {
      @if (dataIsNotFound) {
        <app-centered-box>
          <app-no-results-found [message]="'pages.dataBrowser.dataClassView.noData' | translate" />
        </app-centered-box>
      } @else {
        <app-data-class-header [classSelected]="classSelected" />
        <!-- selectMode is a plain field with no change notification: keep it in the template. A
             computed that reads it behind a short-circuited signal read caches forever. -->
        @if ((selectedResources$ | async)?.length && multipleViewerService.selectMode) {
          <app-resource-list-selection />
        }
        <as-split direction="horizontal" unit="pixel" (dragEnd)="onResultListDragged($event)">
          <as-split-area [size]="panelSize()" cdkScrollable>
            <app-data-class-panel [classSelected]="classSelected" />
          </as-split-area>
          <!-- Hidden, not zero-width: a zero-width area still renders the viewer and keeps fetching. -->
          <as-split-area [size]="viewerSize()" [visible]="viewerIsVisible()">
            <app-multiple-viewer (afterResourceDeleted)="onResourceDeleted()" />
          </as-split-area>
        </as-split>
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  styles: [
    `
      /* A column, so the split gets the height left under the header; 100% would overflow by the header. */
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }
      app-data-class-header,
      app-resource-list-selection {
        flex: none;
      }
      as-split {
        flex: 1 1 0;
        min-height: 0;
      }
      .viewer-area {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }
      .viewer-toolbar {
        display: flex;
        justify-content: flex-end;
        flex: none;
      }
      app-multiple-viewer {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
  imports: [
    AsyncPipe,
    TranslatePipe,
    AngularSplitModule,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    AppProgressIndicatorComponent,
    DataClassHeaderComponent,
    DataClassPanelComponent,
    MultipleViewerComponent,
    ResourceListSelectionComponent,
  ],
  // Scoped here so the header and the list share one query, one `ResourceResultService`, and a class
  // switch disposes them.
  providers: [...provideSearchFilters(), ...provideDataClassSearch(), ResourceResultService],
})
export class DataClassViewComponent {
  private readonly _view = toSignal(inject(DataClassUrlStateService).view$, { initialValue: 'list' as DataClassView });

  /** Public: the selection banner's visibility is decided in this component's template. */
  readonly multipleViewerService = inject(MultipleViewerService);
  readonly selectedResources$ = this.multipleViewerService.selectedResources$;

  private readonly _breakpoints = inject(BreakpointObserver);

  /** The width for the widest breakpoint the screen reaches. */
  private readonly _breakpointWidth = toSignal(
    this._breakpoints.observe(QUERIES).pipe(map(() => this._widthForScreen())),
    { initialValue: this._widthForScreen() }
  );

  /** The width the user dragged the result list to, if they have. */
  private readonly _draggedWidth = signal<number | undefined>(undefined);

  /**
   * The breakpoint's width until the user drags the result list; from then on, their width —
   * resizing the window no longer changes it.
   */
  readonly resultListWidth = computed(() => this._draggedWidth() ?? this._breakpointWidth());

  readonly viewerIsVisible = computed(() => this._view() !== 'table');

  /** Pixel split: in table view the hidden viewer gets a number so the split never sees two `*`. */
  readonly panelSize = computed(() => (this.viewerIsVisible() ? this.resultListWidth() : ('*' as const)));
  readonly viewerSize = computed(() => (this.viewerIsVisible() ? ('*' as const) : 0));

  dataIsNotFound = false;
  data$ = combineLatest([
    this._route.params,
    this._projectPageService.currentProject$.pipe(first()),
    this._projectPageService.ontologies$,
  ]).pipe(
    map(([params, project, ontologies]) => {
      this.dataIsNotFound = false;
      const ontologyLabel = params[RouteConstants.ontologyParameter] as string;
      const classLabel = params[RouteConstants.classParameter] as string;

      const ontology = ontologies.find(
        ontology_ => ontology_.id === this._ontologyService.getOntologyIriFromRoute(project.shortcode, ontologyLabel)
      );

      if (!ontology) {
        this.dataIsNotFound = true;
        return EMPTY;
      }

      const classId = this._ontologyService.getClassIdFromParams(project.shortcode, ontologyLabel, classLabel);
      const resClass = Object.values(ontology.classes).find(cls => cls.id === classId);

      if (!resClass) {
        this.dataIsNotFound = true;
        return EMPTY;
      }

      return { ontologyLabel, classLabel, ontology, resClass: resClass as ResourceClassDefinitionWithAllLanguages };
    })
  );
  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _ontologyService: OntologyService,
    private readonly _urlState: DataClassUrlStateService,
    private readonly _draftStore: StatementDraftStore
  ) {
    this._clearSearchStateOnClassSwitch();
  }

  /** Filters belong to their class, so a class switch resets them. `skip(1)` keeps deep links intact. */
  private _clearSearchStateOnClassSwitch(): void {
    this._route.params
      .pipe(
        map(params => params[RouteConstants.classParameter] as string),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this._urlState.reset();
        // Drafts are not in the URL, so the reset alone would not clear them.
        this._draftStore.discardDrafts();
      });
  }

  onResourceDeleted() {
    this._projectPageService.reloadProject();
  }

  onResultListDragged({ sizes }: SplitGutterInteractionEvent): void {
    const [width] = sizes;
    if (typeof width === 'number') {
      this._draggedWidth.set(width);
    }
  }

  private _widthForScreen(): number {
    const match = RESULT_LIST_WIDTHS.find((_, index) => this._breakpoints.isMatched(QUERIES[index]));
    return match ? match[1] : RESULT_LIST_WIDTH_BELOW_MD;
  }
}
