import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { DataModelMapComponent, MapDetail } from '../sidenav/data-model-map/data-model-map.component';
import { classColors, GraphLayout, GraphSize, linkedWith } from './ontology-graph-elements';
import { OntologyGraphComponent } from './ontology-graph.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

/**
 * Query parameters of the Ontology map tab: the data model to show, the class to outline, the class whose panel is
 * open and the class the graph is filtered on. Classes are named by the end of their IRI, within the data model.
 */
export const ONTOLOGY_MAP_PARAM = { ontology: 'ontology', class: 'class', panel: 'panel', filter: 'filter' } as const;

const classNameOf = (iri: string) => iri.substring(iri.lastIndexOf('#') + 1);

const DETAIL_KEY = 'dsp-ontology-map-detail';
const VIEW_KEY = 'dsp-ontology-map-view';
const LAYOUT_KEY = 'dsp-ontology-map-layout';
const SIZE_KEY = 'dsp-ontology-map-size';

const SIZES: GraphSize[] = ['small', 'normal', 'large'];

/** `map`: our own map, with summary or property cards. `graph`: the Cytoscape graph, to compare the two. */
type OntologyMapView = 'map' | 'graph';

const LAYOUTS: { value: GraphLayout; icon: string }[] = [
  { value: 'circle', icon: 'radio_button_unchecked' },
  { value: 'tree', icon: 'account_tree' },
  { value: 'force', icon: 'bubble_chart' },
  { value: 'grid', icon: 'grid_view' },
];

/**
 * The Ontology map tab: the map of one data model of the project, drawn large across the page, with a toolbar to
 * pick the data model and how much each card shows. A class clicked on it opens its details in a panel docked at
 * the right, from which it can be browsed in the Data tab or edited.
 */
@Component({
  selector: 'app-ontology-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataModelMapComponent,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    OntologyGraphComponent,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @let m = 'pages.ontologyMap';
    <div class="page">
      @if (selected(); as selected) {
        <div class="canvas">
          <div class="toolbar">
            @if (ontologies().length > 1) {
              <button
                mat-stroked-button
                class="data-model"
                data-cy="ontology-map-data-model"
                [matMenuTriggerFor]="dataModels">
                <span class="data-model-label">{{ m + '.dataModel' | translate }}</span>
                <b>{{ selected.label }}</b>
                <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
              </button>
            } @else {
              <span class="data-model static" data-cy="ontology-map-data-model">
                <span class="data-model-label">{{ m + '.dataModel' | translate }}</span>
                <b>{{ selected.label }}</b>
              </span>
            }
            <mat-menu #dataModels="matMenu">
              @for (ontology of ontologies(); track ontology.iri) {
                <button mat-menu-item (click)="show(ontology.iri)">{{ ontology.label }}</button>
              }
            </mat-menu>
            @if (counts(); as counts) {
              <span class="counts">{{ m + '.counts' | translate: counts }}</span>
            }
            <span class="spacer"></span>
            <mat-button-toggle-group
              class="toggle"
              hideSingleSelectionIndicator
              data-cy="ontology-map-view"
              [attr.aria-label]="m + '.view' | translate"
              [value]="view()"
              (change)="setView($event.value)">
              <mat-button-toggle value="graph">
                <mat-icon>hub</mat-icon>{{ m + '.viewGraph' | translate }}
              </mat-button-toggle>
              <mat-button-toggle value="map">
                <mat-icon>dashboard</mat-icon>{{ m + '.viewMap' | translate }}
              </mat-button-toggle>
            </mat-button-toggle-group>
            @if (view() === 'graph') {
              <button
                mat-stroked-button
                class="data-model"
                data-cy="ontology-map-class-filter"
                [matMenuTriggerFor]="classFilter">
                <span class="data-model-label">{{ m + '.classFilter' | translate }}</span>
                <b>{{ filterLabel() ?? (m + '.allClasses' | translate) }}</b>
                <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
              </button>
              <mat-menu #classFilter="matMenu">
                <button mat-menu-item (click)="setFilter(undefined)">{{ m + '.allClasses' | translate }}</button>
                @for (option of classOptions(); track option.id) {
                  <button mat-menu-item (click)="setFilter(option.id)">{{ option.label }}</button>
                }
              </mat-menu>
              @if (filterIri()) {
                <button mat-button data-cy="ontology-map-class-reset" (click)="setFilter(undefined)">
                  <mat-icon>close</mat-icon>
                  {{ m + '.resetFilter' | translate }}
                </button>
              }
              <mat-button-toggle-group
                class="toggle"
                hideSingleSelectionIndicator
                data-cy="ontology-map-layout"
                [attr.aria-label]="m + '.layout' | translate"
                [value]="layout()"
                (change)="setLayout($event.value)">
                @for (option of layouts; track option.value) {
                  <mat-button-toggle [value]="option.value">
                    <mat-icon>{{ option.icon }}</mat-icon
                    >{{ m + '.layouts.' + option.value | translate }}
                  </mat-button-toggle>
                }
              </mat-button-toggle-group>
              <mat-button-toggle-group
                class="toggle"
                hideSingleSelectionIndicator
                data-cy="ontology-map-size"
                [attr.aria-label]="m + '.size' | translate"
                [value]="size()"
                (change)="setSize($event.value)">
                @for (option of sizes; track option) {
                  <mat-button-toggle [value]="option">{{ m + '.sizes.' + option | translate }}</mat-button-toggle>
                }
              </mat-button-toggle-group>
              <button
                mat-icon-button
                class="fit"
                data-cy="ontology-map-fit"
                [attr.aria-label]="m + '.fit' | translate"
                [matTooltip]="m + '.fit' | translate"
                (click)="graphView()?.fit()">
                <mat-icon>fit_screen</mat-icon>
              </button>
            } @else {
              <mat-button-toggle-group
                class="toggle"
                hideSingleSelectionIndicator
                data-cy="ontology-map-detail"
                [attr.aria-label]="m + '.detail' | translate"
                [value]="detail()"
                (change)="setDetail($event.value)">
                <mat-button-toggle value="summary">
                  <mat-icon>view_agenda</mat-icon>{{ m + '.summary' | translate }}
                </mat-button-toggle>
                <mat-button-toggle value="properties">
                  <mat-icon>list_alt</mat-icon>{{ m + '.properties' | translate }}
                </mat-button-toggle>
              </mat-button-toggle-group>
            }
          </div>

          @if (graph(); as graph) {
            <div class="body" [class.overlay]="view() === 'graph'">
              @if (view() === 'graph') {
                <app-ontology-graph
                  class="view"
                  [graph]="graphShown() ?? graph"
                  [selectedIri]="classIri()"
                  [layout]="layout()"
                  [size]="size()"
                  [highlightedProperty]="hoveredProperty()"
                  [colors]="colors()"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  (classSelected)="openPanel($event)"
                  (classFiltered)="filterOn($event)"
                  (backgroundClicked)="panelIri() && openPanel(undefined)" />
              } @else {
                <app-data-model-map
                  class="view"
                  [graph]="graph"
                  [selectedIri]="classIri()"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  [full]="true"
                  [detail]="detail()"
                  (classSelected)="openPanel($event)" />
              }
              @if (panelIri(); as openIri) {
                <app-resource-class-panel
                  class="panel"
                  [graph]="graph"
                  [classIri]="openIri"
                  [dataModelLabel]="selected.label"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  [subclassLabel]="t + '.subclassOf' | translate"
                  [canEdit]="canEdit() ?? false"
                  (classSelected)="openPanel($event)"
                  (closed)="openPanel(undefined)"
                  (browse)="open($event)"
                  (filter)="filterOn($event)"
                  (propertyHovered)="hoveredProperty.set($event)"
                  (edit)="edit($event)" />
              }
            </div>
          }
        </div>
      } @else if (ontologiesLoaded()) {
        <p class="empty">{{ m + '.noDataModels' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
        height: 100%;
      }

      // The tab's whole height, the map box stretched to fill it.
      .page {
        box-sizing: border-box;
        height: 100%;
        // As the data model editor: 8px around the content.
        padding: 8px;
      }

      // The map's box: the toolbar on top, then the map and, when a class is open, its panel beside it.
      .canvas {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: $cool_gray_50;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
        overflow: hidden;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
      }

      .data-model {
        --mat-button-outlined-container-height: 34px;
        background: white;

        .data-model-label {
          margin-right: 6px;
          font-size: 12px;
          color: $cool_gray_500;
        }

        b {
          font-weight: 500;
        }

        &.static {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 12px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
      }

      .counts {
        font-size: 12px;
        color: $cool_gray_600;
      }

      .spacer {
        flex: 1;
      }

      .fit {
        --mat-icon-button-state-layer-size: 34px;
        padding: 5px;
      }

      .toggle {
        --mat-button-toggle-height: 34px;
        --mat-button-toggle-label-text-size: 13px;
        background: white;

        mat-icon {
          margin-right: 6px;
          font-size: 18px;
          width: 18px;
          height: 18px;
          vertical-align: middle;
        }
      }

      .body {
        flex: 1;
        min-height: 0;
        display: flex;
      }

      .view {
        flex: 1;
        min-width: 0;
      }

      .panel {
        flex: none;
        width: 440px;
        max-width: 50%;
      }

      // In the Graph view the panel floats over the graph, which keeps its size, so opening a class moves nothing.
      .body.overlay {
        position: relative;

        .panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }
      }

      .empty {
        color: $cool_gray_500;
      }
    `,
  ],
})
export class OntologyMapPageComponent {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _graphs = inject(DataModelGraphService);

  private readonly _projectOntologies = toSignal(
    combineLatest([this._graphs.projectOntologies$, inject(LocalizationService).currentLanguage$]).pipe(
      map(([ontologies, lang]) =>
        ontologies
          .map(({ ontology }) => ({ iri: ontology.iri, label: ontology.label }))
          .sort((a, b) => SortingHelper.compareStringsByLanguage(a.label, b.label, lang))
      )
    )
  );
  readonly ontologies = computed(() => this._projectOntologies() ?? []);
  readonly ontologiesLoaded = computed(() => this._projectOntologies() !== undefined);
  readonly canEdit = toSignal(inject(ProjectPageService).hasProjectAdminRights$);

  private readonly _graphsByIri = toSignal(this._graphs.graphs$);
  private readonly _params = toSignal(this._route.queryParamMap);

  /** The data model named in the URL, else the first one. */
  readonly selected = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.ontology);
    const ontologies = this.ontologies();
    return ontologies.find(o => OntologyService.getOntologyNameFromIri(o.iri) === name) ?? ontologies[0];
  });
  readonly graph = computed(() => {
    const iri = this.selected()?.iri;
    return iri ? this._graphsByIri()?.get(iri) : undefined;
  });
  readonly counts = computed(() => {
    const graph = this.graph();
    if (!graph) return undefined;
    return {
      classes: graph.nodes.filter(node => node.kind === 'class').length,
      links: graph.edges.filter(edge => edge.kind === 'link').length,
    };
  });

  readonly layouts = LAYOUTS;
  /** The Cytoscape graph by default, or our map; remembered in this browser. */
  readonly view = signal<OntologyMapView>(readStored(VIEW_KEY) === 'map' ? 'map' : 'graph');
  /** How the graph view arranges the classes; remembered in this browser. */
  readonly layout = signal<GraphLayout>(
    LAYOUTS.find(option => option.value === readStored(LAYOUT_KEY))?.value ?? 'circle'
  );
  readonly sizes = SIZES;
  /** How big the graph draws boxes, text and lines; remembered in this browser. */
  readonly size = signal<GraphSize>(SIZES.find(size => size === readStored(SIZE_KEY)) ?? 'normal');
  readonly graphView = viewChild(OntologyGraphComponent);

  /** Whether cards show their summary or their properties; remembered in this browser. */
  readonly detail = signal<MapDetail>(readStored(DETAIL_KEY) === 'properties' ? 'properties' : 'summary');

  /** A colour per class of the data model, the same whatever the graph is filtered on. */
  readonly colors = computed(() => {
    const graph = this.graph();
    return graph ? classColors(graph) : new Map<string, string>();
  });

  /** In the Graph view, the class to show with only the classes it is linked with; all classes when unset. */
  readonly filterIri = computed(() => this._classFromUrl(ONTOLOGY_MAP_PARAM.filter));
  readonly classOptions = computed(() =>
    (this.graph()?.nodes ?? [])
      .filter(node => node.kind === 'class')
      .map(node => ({ id: node.id, label: node.label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  readonly filterLabel = computed(() => this.classOptions().find(option => option.id === this.filterIri())?.label);
  /** What the Graph view draws: the data model, narrowed to the filtered class and the classes it is linked with. */
  readonly graphShown = computed(() => {
    const graph = this.graph();
    return graph ? linkedWith(graph, this.filterIri()) : undefined;
  });

  /** A property hovered in the class panel; the graph highlights its links. */
  readonly hoveredProperty = signal<string | undefined>(undefined);

  constructor() {
    // A panel that changes class, or closes, under the pointer never reports the pointer leaving its rows.
    effect(() => {
      this.panelIri();
      untracked(() => this.hoveredProperty.set(undefined));
    });
  }

  /** The class whose panel is open. */
  readonly panelIri = computed(() => this._classFromUrl(ONTOLOGY_MAP_PARAM.panel));
  /** The class the map outlines: the one whose panel is open, else the one named in the URL. */
  readonly classIri = computed(() => this.panelIri() ?? this._params()?.get(ONTOLOGY_MAP_PARAM.class) ?? undefined);

  /** Shows another data model, with no panel open and no filter. */
  show(ontologyIri: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) },
    });
  }

  setDetail(detail: MapDetail): void {
    this.detail.set(detail);
    store(DETAIL_KEY, detail);
  }

  setView(view: OntologyMapView): void {
    this.view.set(view);
    store(VIEW_KEY, view);
  }

  /** Opens the class's panel, or closes it; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._navigate({ [ONTOLOGY_MAP_PARAM.panel]: classIri ? classNameOf(classIri) : null });
  }

  /** Filters the graph on the class, or shows every class again; a step in the browser history. */
  setFilter(classIri: string | undefined): void {
    this._navigate({ [ONTOLOGY_MAP_PARAM.filter]: classIri ? classNameOf(classIri) : null });
  }

  /** Shows the class with only the classes it is linked with, in the Graph view. */
  filterOn(classIri: string): void {
    this.setView('graph');
    this.setFilter(classIri);
  }

  /** Changes some query parameters, keeping the others; the data model is named so the class names resolve. */
  private _navigate(params: Record<string, string | null>): void {
    const ontologyIri = this.selected()?.iri;
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: {
        ...(ontologyIri ? { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) } : {}),
        ...params,
      },
    });
  }

  /** The class of the shown data model that a query parameter names, if it names one. */
  private _classFromUrl(param: string): string | undefined {
    const name = this._params()?.get(param);
    if (!name) return undefined;
    return this.graph()?.nodes.find(node => node.kind === 'class' && classNameOf(node.id) === name)?.id;
  }

  setSize(size: GraphSize): void {
    this.size.set(size);
    store(SIZE_KEY, size);
  }

  setLayout(layout: GraphLayout): void {
    this.layout.set(layout);
    store(LAYOUT_KEY, layout);
  }

  /** Opens the class in the Data tab. */
  open(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(['..', RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className], {
      relativeTo: this._route,
    });
  }

  /** Opens the class's data model in the data model editor. */
  edit(iri: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(
      [
        '..',
        RouteConstants.ontology,
        OntologyService.getOntologyNameFromIri(ontologyIri),
        RouteConstants.editor,
        RouteConstants.classes,
      ],
      { relativeTo: this._route }
    );
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts until the page reloads.
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
