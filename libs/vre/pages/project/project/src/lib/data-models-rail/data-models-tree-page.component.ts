import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemMeta, MatNavList } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { FeatureTourComponent, FeatureTourStep } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { AngularSplitModule, SplitGutterInteractionEvent } from 'angular-split';
import { filter, map, startWith } from 'rxjs';
import { SIDEBAR_WIDTHS } from '../data-browser-page.component';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { CanDoChecks } from './can-do-checks';
import { DataModelsRailState } from './data-models-rail-state';

/** A data model's sections, in the order the rail lists them under it. */
const MODEL_SECTIONS = [
  { path: RouteConstants.classes, icon: 'view_list' },
  { path: RouteConstants.properties, icon: 'label' },
  { path: RouteConstants.graph, icon: 'hub' },
] as const;

/** The rail's least width: below it, its headings and the data models' names would crowd. */
const RAIL_MIN_WIDTH = 260;
const RAIL_QUERIES = SIDEBAR_WIDTHS.map(([minWidth]) => `(min-width: ${minWidth}px)`);

/** A vocabulary's name in the URL: the end of its IRI. */
function nameOf(listIri: string): string {
  return listIri.split('/').pop() ?? '';
}

/** The query parameter naming the data model, for its sections' links. */
function paramOf(ontologyIri: string): Record<string, string> {
  return { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) };
}

/**
 * The Data models tab: a rail listing every data model of the project as a group that folds open on its sections
 * (its classes, its properties, its diagram), then the project's controlled vocabularies by name, and the
 * documentation; what is picked beside it. No overview: the tab opens on the first data
 * model's classes. Editors create a data model or a vocabulary from the "+" by each heading, and edit or delete a data
 * model with the pen and the bin shown on hover.
 */
@Component({
  selector: 'app-data-models-tree-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    AngularSplitModule,
    FeatureTourComponent,
    MatDivider,
    MatIcon,
    MatIconButton,
    MatListItem,
    MatListItemIcon,
    MatListItemMeta,
    MatNavList,
    MatTooltip,
    RouterLink,
    RouterOutlet,
    StringifyStringLiteralPipe,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels';
    @let editor = state.canEdit() && editing.canEditDataModels;
    <!-- As the Data tab: the rail beside the content, its gutter dragged to widen it. -->
    <as-split class="page" direction="horizontal" unit="pixel" (dragEnd)="onRailDragged($event)">
      <as-split-area [size]="railSize()">
        <aside #tourRail class="rail" data-cy="data-models-tree">
          <div class="heading">
            <!-- What a data model is, as the Data models tab says it. -->
            <span class="title">
              {{ r + '.dataModels' | translate }}
              <mat-icon
                class="info"
                tabindex="0"
                data-cy="data-models-tree-info"
                [attr.aria-label]="'pages.ontology.dataModels.info' | translate"
                [matTooltip]="'pages.ontology.dataModels.info' | translate"
                >info_outline</mat-icon
              >
            </span>
            @if (editor) {
              <button
                mat-icon-button
                type="button"
                class="small"
                data-cy="data-models-tree-create-model"
                [attr.aria-label]="r + '.createDataModel' | translate"
                [matTooltip]="r + '.createDataModel' | translate"
                (click)="createDataModel()">
                <mat-icon>add</mat-icon>
              </button>
            }
          </div>

          @for (model of state.ontologies(); track model.iri) {
            @let open = expanded().has(model.iri);
            @let current = model.iri === state.selected()?.iri;
            @let counts = state.counts().get(model.iri);
            <!-- The data model: its fold, its name (opens it), and for editors, on hover, its pen and bin. -->
            <div
              class="model"
              [class.current]="current"
              data-cy="data-models-tree-model"
              (mouseenter)="editor && checkDelete(model.iri, true)"
              (mouseleave)="cancelCheck()"
              (focusin)="editor && checkDelete(model.iri)">
              <button
                mat-icon-button
                type="button"
                class="small fold"
                [attr.aria-expanded]="open"
                [attr.aria-label]="r + '.showSections' | translate: { model: model.label }"
                (click)="toggle(model.iri)">
                <mat-icon>{{ open ? 'expand_more' : 'chevron_right' }}</mat-icon>
              </button>
              <button type="button" class="name" (click)="openModel(model.iri)">{{ model.label }}</button>
              @if (editor) {
                <button
                  mat-icon-button
                  type="button"
                  class="small hover-action"
                  data-cy="data-models-tree-edit-model"
                  [attr.aria-label]="r + '.editDataModel' | translate"
                  [matTooltip]="r + '.editDataModel' | translate"
                  (click)="editModel(model)">
                  <mat-icon>edit</mat-icon>
                </button>
                @let check = deleteChecks().get(model.iri);
                <span
                  class="hover-action"
                  [matTooltip]="
                    (!check
                      ? r + '.checkingDelete'
                      : check.canDo
                        ? r + '.deleteDataModel'
                        : r + '.cannotDeleteDataModel'
                    ) | translate
                  ">
                  <button
                    mat-icon-button
                    type="button"
                    class="small delete"
                    data-cy="data-models-tree-delete-model"
                    [attr.aria-label]="r + '.deleteDataModel' | translate"
                    [disabled]="!check?.canDo"
                    (click)="deleteModel(model.iri, model.label)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </span>
              }
            </div>
            @if (open) {
              <mat-nav-list class="sections">
                @for (item of sections; track item.path) {
                  @let active = current && section() === item.path;
                  <a
                    #tourSection
                    mat-list-item
                    class="rail-link"
                    [class.current]="active"
                    [activated]="active"
                    [attr.aria-current]="active ? 'page' : null"
                    [routerLink]="item.path"
                    [queryParams]="modelParams().get(model.iri)"
                    [attr.data-cy]="'data-models-tree-' + item.path">
                    <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                    <span class="rail-text">{{ r + '.' + item.path | translate }}</span>
                    @if (item.path === classes && counts) {
                      <span matListItemMeta class="count">{{ counts.classes }}</span>
                    } @else if (item.path === properties && counts) {
                      <span matListItemMeta class="count">{{ counts.properties }}</span>
                    }
                  </a>
                }
              </mat-nav-list>
            }
          }

          <!-- The project's controlled vocabularies, which all its data models can use; each opens as in the Data models tab. -->
          <div class="heading project">
            <span class="title">
              {{ r + '.lists' | translate }}
              <mat-icon
                class="info"
                tabindex="0"
                data-cy="data-models-tree-vocabularies-info"
                [attr.aria-label]="'pages.ontology.dataModels.vocabularies.info' | translate"
                [matTooltip]="'pages.ontology.dataModels.vocabularies.info' | translate"
                >info_outline</mat-icon
              >
            </span>
            @if (state.canEdit() && editing.canCreate) {
              <button
                mat-icon-button
                type="button"
                class="small"
                data-cy="data-models-tree-create-vocabulary"
                [attr.aria-label]="r + '.createVocabulary' | translate"
                [matTooltip]="r + '.createVocabulary' | translate"
                (click)="createVocabulary()">
                <mat-icon>add</mat-icon>
              </button>
            }
          </div>
          <mat-nav-list class="sections flat">
            @for (vocabulary of state.lists() ?? []; track vocabulary.id) {
              @let name = listNames().get(vocabulary.id);
              @let active = section() === list && route().list === name;
              <a
                mat-list-item
                class="rail-link"
                [class.current]="active"
                [activated]="active"
                [attr.aria-current]="active ? 'page' : null"
                [routerLink]="[list, name]"
                data-cy="data-models-tree-vocabulary">
                <mat-icon matListItemIcon>list</mat-icon>
                <span class="rail-text">{{ vocabulary.labels | appStringifyStringLiteral }}</span>
              </a>
            }
            @if (state.canEdit()) {
              <!-- A line sets the documentation apart from the project's vocabularies. -->
              <mat-divider class="docs-divider" />
              <a mat-list-item class="rail-link docs" [href]="docs" target="_blank" rel="noopener">
                <mat-icon matListItemIcon>open_in_new</mat-icon>
                <span class="rail-text">{{ r + '.documentation' | translate }}</span>
              </a>
            }
          </mat-nav-list>
        </aside>
      </as-split-area>

      <as-split-area size="*">
        <div class="main">
          <main class="content">
            <router-outlet />
          </main>
        </div>
      </as-split-area>
    </as-split>

    <app-feature-tour tour="dataModels" [steps]="tourSteps()" />
  `,
  styleUrl: './data-models-tree-page.component.css',
})
export class DataModelsTreePageComponent {
  readonly state = inject(DataModelsRailState);
  readonly editing = injectDataModelEditing();
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _breakpoints = inject(BreakpointObserver);

  /** The rail's width, as the Data tab's sidebar at each breakpoint, but never under 260px: its entries fit whole. */
  readonly railWidth = toSignal(this._breakpoints.observe(RAIL_QUERIES).pipe(map(() => this._railWidthForScreen())), {
    initialValue: this._railWidthForScreen(),
  });

  /** The width the user dragged the rail to, if they have. */
  private readonly _draggedWidth = signal<number | undefined>(undefined);

  /** The breakpoint's width until the user drags the rail, as in the Data tab; then theirs. */
  readonly railSize = computed(() => this._draggedWidth() ?? this.railWidth());

  onRailDragged({ sizes }: SplitGutterInteractionEvent): void {
    const [width] = sizes;
    if (typeof width === 'number') {
      this._draggedWidth.set(width);
    }
  }

  readonly sections = MODEL_SECTIONS;
  readonly classes = RouteConstants.classes;
  readonly properties = RouteConstants.properties;
  readonly list = RouteConstants.list;
  readonly docs = 'https://dasch.swiss/knowledge-hub/dsp-app/project-admin#data-model';

  /** What the URL shows: a data model's section, or a controlled vocabulary by its name. */
  readonly route = toSignal(
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const child = this._route.firstChild?.snapshot;
        return {
          section: child?.url?.[0]?.path,
          list: child?.paramMap.get(RouteConstants.listParameter) ?? undefined,
        };
      })
    ),
    { initialValue: { section: undefined, list: undefined } }
  );
  readonly section = computed(() => this.route().section);

  /** The query parameter naming each data model, for its sections' links. */
  readonly modelParams = computed(() => new Map(this.state.ontologies().map(model => [model.iri, paramOf(model.iri)])));
  /** Each vocabulary's name in the URL. */
  readonly listNames = computed(() => new Map((this.state.lists() ?? []).map(list => [list.id, nameOf(list.id)])));

  /** The data models folded open on their sections; the one shown opens by itself. */
  readonly expanded = signal(new Set<string>());

  private readonly _tourRail = viewChild('tourRail', { read: ElementRef });
  private readonly _tourSections = viewChildren('tourSection', { read: ElementRef });

  /** The tour of the rail. With several data models, it points at the sections of the first one folded open. */
  readonly tourSteps = computed<FeatureTourStep[]>(() => {
    // An open data model lists all its sections, in `MODEL_SECTIONS` order: the first open one's come first.
    const section = (path: string) => this._tourSections()[MODEL_SECTIONS.findIndex(known => known.path === path)];
    const beside = (anchor: FeatureTourStep['anchor'], titleKey: string, bodyKey: string): FeatureTourStep => ({
      anchor,
      placement: 'right',
      align: 'start',
      titleKey,
      bodyKey,
    });
    return [
      {
        // The rail is as tall as the page: the ring goes around what it lists.
        ...beside(this._tourRail(), 'pages.dataModels.tour.overviewTitle', 'pages.dataModels.tour.overviewBody'),
        ring: 'content',
      },
      beside(
        [section(RouteConstants.classes), section(RouteConstants.properties)],
        'pages.dataModels.tour.sectionsTitle',
        'pages.dataModels.tour.sectionsBody'
      ),
      beside(section(RouteConstants.graph), 'pages.dataModels.tour.diagramTitle', 'pages.dataModels.tour.diagramBody'),
    ];
  });

  /** What the API says of deleting each data model, once asked; none while it checks. */
  private readonly _deleteChecks = new CanDoChecks(iri => this.editing.canDeleteDataModel(iri), this._destroyRef);
  readonly deleteChecks = this._deleteChecks.results;

  constructor() {
    // Read again after an edit: a data model emptied may be deletable now, and the other way round.
    effect(() => {
      this.state.counts();
      untracked(() => this._deleteChecks.clear());
    });
    // The sections' links and "Open in…" lead to this tab.
    this.state.tab = RouteConstants.dataModels;
    // The data model shown folds open when it changes; folding it again is the viewer's choice.
    effect(() => {
      const iri = this.state.selected()?.iri;
      if (iri) untracked(() => this.expanded.update(open => new Set(open).add(iri)));
    });
  }

  toggle(ontologyIri: string): void {
    this.expanded.update(open => {
      const next = new Set(open);
      if (!next.delete(ontologyIri)) next.add(ontologyIri);
      return next;
    });
  }

  /** Opens the data model in the section shown, or on its classes from the vocabularies; folds it open. */
  openModel(ontologyIri: string): void {
    const section = this.section();
    const keep = MODEL_SECTIONS.some(known => known.path === section) ? section! : RouteConstants.classes;
    this.expanded.update(open => new Set(open).add(ontologyIri));
    this._router.navigate([keep], { relativeTo: this._route, queryParams: paramOf(ontologyIri) });
  }

  /** Asks the API whether the data model can be deleted, for its bin to say so; `soon` waits for the pointer to rest. */
  checkDelete(ontologyIri: string, soon = false): void {
    if (soon) this._deleteChecks.checkSoon(ontologyIri);
    else this._deleteChecks.check(ontologyIri);
  }

  cancelCheck(): void {
    this._deleteChecks.cancel();
  }

  editModel(model: { iri: string; label: string }): void {
    this.editing.editDataModel({ ...model, comment: this.state.commentOf(model.iri) });
  }

  /** Deletes the data model once confirmed, then shows the first data model left. */
  deleteModel(ontologyIri: string, label: string): void {
    this.editing
      .deleteDataModel(ontologyIri, label)
      .pipe(filter(Boolean), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._router.navigate([RouteConstants.classes], { relativeTo: this._route }));
  }

  /** Creates a data model, then opens it, ready for its first classes. */
  createDataModel(): void {
    this.editing.createDataModel(iri => {
      this.expanded.update(open => new Set(open).add(iri));
      this._router.navigate([RouteConstants.classes], { relativeTo: this._route, queryParams: paramOf(iri) });
    });
  }

  /** Creates a controlled vocabulary, then shows it opened, ready for its first values. */
  createVocabulary(): void {
    this.editing.createVocabulary(iri =>
      this._router.navigate([RouteConstants.list, nameOf(iri)], { relativeTo: this._route })
    );
  }

  private _railWidthForScreen(): number {
    const match = SIDEBAR_WIDTHS.find((_, index) => this._breakpoints.isMatched(RAIL_QUERIES[index]));
    return Math.max(match ? match[1] : 0, RAIL_MIN_WIDTH);
  }
}
