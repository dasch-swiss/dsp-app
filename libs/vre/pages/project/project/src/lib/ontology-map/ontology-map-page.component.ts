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
import { MatButton } from '@angular/material/button';
import { MatPseudoCheckbox } from '@angular/material/core';
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
import {
  classColors,
  GraphLayout,
  GraphSize,
  linkedWith,
  throughProperties,
  withInheritedLinks,
} from './ontology-graph-elements';
import { OntologyGraphComponent } from './ontology-graph.component';
import { PropertyPanelComponent } from './property-panel.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

/**
 * Query parameters of the Ontology map tab: the data model to show, the class to outline, the class whose panel is
 * open, the link property whose panel is open, and the classes or properties the graph is filtered on. Classes are named by the end of their IRI, within the data model.
 */
export const ONTOLOGY_MAP_PARAM = {
  ontology: 'ontology',
  class: 'class',
  panel: 'panel',
  filter: 'filter',
  property: 'property',
  propertyPanel: 'propertyPanel',
} as const;

const classNameOf = (iri: string) => iri.substring(iri.lastIndexOf('#') + 1);

const DETAIL_KEY = 'dsp-ontology-map-detail';
const VIEW_KEY = 'dsp-ontology-map-view';
const LAYOUT_KEY = 'dsp-ontology-map-layout';
const SIZE_KEY = 'dsp-ontology-map-size';
const LEVEL_LABELS_KEY = 'dsp-ontology-map-level-labels';

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
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatPseudoCheckbox,
    MatTooltip,
    OntologyGraphComponent,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @let m = 'pages.ontologyMap';
    <div class="page">
      @if (selected(); as selected) {
        <div class="canvas">
          @if (graph(); as graph) {
            <div class="body" [class.overlay]="view() === 'graph'">
              @if (view() === 'graph') {
                <app-ontology-graph
                  class="view"
                  [graph]="graphShown() ?? graph"
                  [selectedIri]="classIri()"
                  [layout]="layout()"
                  [size]="size()"
                  [levelLabels]="levelLabels()"
                  [highlightedProperty]="hoveredProperty() ?? propertyPanelIri()"
                  [colors]="colors()"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  (classSelected)="openPanel($event)"
                  (classFiltered)="filterOn($event)"
                  (propertySelected)="openPropertyPanel($event)"
                  (backgroundClicked)="(panelIri() || propertyPanelIri()) && openPanel(undefined)" />
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
              @if (view() === 'graph') {
                <!-- What to show: the data model and its filters, top left. -->
                <div class="float filters">
                  @if (ontologies().length > 1) {
                    <button
                      mat-button
                      class="data-model"
                      data-cy="ontology-map-data-model"
                      [attr.aria-label]="m + '.dataModel' | translate"
                      [matMenuTriggerFor]="dataModels">
                      {{ selected.label }}
                      <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
                    </button>
                  } @else {
                    <span class="data-model static" data-cy="ontology-map-data-model">{{ selected.label }}</span>
                  }
                  <mat-menu #dataModels="matMenu">
                    @for (ontology of ontologies(); track ontology.iri) {
                      <button mat-menu-item (click)="show(ontology.iri)">{{ ontology.label }}</button>
                    }
                  </mat-menu>
                  @if (counts(); as counts) {
                    <span class="counts">{{ m + '.counts' | translate: counts }}</span>
                  }
                  <span class="divider"></span>
                  <span class="chip" [class.active]="filterIris().length > 0">
                    <button
                      type="button"
                      class="chip-trigger"
                      data-cy="ontology-map-class-filter"
                      [matMenuTriggerFor]="classFilter">
                      <mat-icon>filter_list</mat-icon>
                      {{ m + '.classFilter' | translate }}
                      @switch (filterIris().length) {
                        @case (0) {}
                        @case (1) {
                          <b>{{ filterLabel() }}</b>
                        }
                        @default {
                          <b>{{ m + '.classesChosen' | translate: { count: filterIris().length } }}</b>
                        }
                      }
                      @if (filterIris().length === 0) {
                        <mat-icon class="drop">arrow_drop_down</mat-icon>
                      }
                    </button>
                    @if (filterIris().length > 0) {
                      <button
                        type="button"
                        class="chip-clear"
                        data-cy="ontology-map-class-reset"
                        [attr.aria-label]="m + '.resetFilter' | translate"
                        [matTooltip]="m + '.resetFilter' | translate"
                        (click)="clearFilters()">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </span>
                  <mat-menu #classFilter="matMenu">
                    <button mat-menu-item (click)="setFilter([])">{{ m + '.allClasses' | translate }}</button>
                    @for (option of classOptions(); track option.id) {
                      @let checked = filterIris().includes(option.id);
                      <!-- Ticking keeps the menu open, to choose several classes. -->
                      <button
                        mat-menu-item
                        role="menuitemcheckbox"
                        [attr.aria-checked]="checked"
                        (click)="$event.stopPropagation(); toggleFilter(option.id)">
                        <mat-pseudo-checkbox class="filter-check" [state]="checked ? 'checked' : 'unchecked'" />
                        {{ option.label }}
                      </button>
                    }
                  </mat-menu>
                  <span class="chip" [class.active]="propertyIris().length > 0">
                    <button
                      type="button"
                      class="chip-trigger"
                      data-cy="ontology-map-property-filter"
                      [matMenuTriggerFor]="propertyFilter">
                      <mat-icon>filter_list</mat-icon>
                      {{ m + '.propertyFilter' | translate }}
                      @switch (propertyIris().length) {
                        @case (0) {}
                        @case (1) {
                          <b>{{ propertyLabel() }}</b>
                        }
                        @default {
                          <b>{{ m + '.propertiesChosen' | translate: { count: propertyIris().length } }}</b>
                        }
                      }
                      @if (propertyIris().length === 0) {
                        <mat-icon class="drop">arrow_drop_down</mat-icon>
                      }
                    </button>
                    @if (propertyIris().length > 0) {
                      <button
                        type="button"
                        class="chip-clear"
                        data-cy="ontology-map-property-reset"
                        [attr.aria-label]="m + '.resetFilter' | translate"
                        [matTooltip]="m + '.resetFilter' | translate"
                        (click)="clearFilters()">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </span>
                  <mat-menu #propertyFilter="matMenu">
                    <button mat-menu-item (click)="setPropertyFilter([])">
                      {{ m + '.allProperties' | translate }}
                    </button>
                    @for (option of propertyOptions(); track option.id) {
                      @let checked = propertyIris().includes(option.id);
                      <button
                        mat-menu-item
                        role="menuitemcheckbox"
                        [attr.aria-checked]="checked"
                        (click)="$event.stopPropagation(); toggleProperty(option.id)">
                        <mat-pseudo-checkbox class="filter-check" [state]="checked ? 'checked' : 'unchecked'" />
                        {{ option.label }}
                        <span class="link-count">{{ option.links }}</span>
                      </button>
                    }
                  </mat-menu>
                </div>

                <!-- How to show it: layout, text size and labels, top right; left of an open panel. -->
                <div
                  class="float display"
                  role="toolbar"
                  [attr.aria-label]="m + '.display' | translate"
                  [class.beside-panel]="panelOpen()">
                  @for (option of layouts; track option.value) {
                    <button
                      type="button"
                      class="tool"
                      [class.on]="layout() === option.value"
                      [attr.aria-pressed]="layout() === option.value"
                      [attr.data-cy]="'ontology-map-layout-' + option.value"
                      [attr.aria-label]="m + '.layouts.' + option.value | translate"
                      [matTooltip]="m + '.layouts.' + option.value | translate"
                      (click)="setLayout(option.value)">
                      <mat-icon>{{ option.icon }}</mat-icon>
                    </button>
                  }
                  <span class="divider"></span>
                  @for (option of sizes; track option) {
                    <button
                      type="button"
                      class="tool size"
                      [attr.data-size]="option"
                      [class.on]="size() === option"
                      [attr.aria-pressed]="size() === option"
                      [attr.data-cy]="'ontology-map-size-' + option"
                      [attr.aria-label]="m + '.sizes.' + option | translate"
                      [matTooltip]="m + '.sizes.' + option | translate"
                      (click)="setSize(option)">
                      A
                    </button>
                  }
                  <span class="divider"></span>
                  <button
                    type="button"
                    class="tool"
                    data-cy="ontology-map-level-labels"
                    [class.on]="levelLabels()"
                    [attr.aria-pressed]="levelLabels()"
                    [attr.aria-label]="m + '.levelLabels' | translate"
                    [matTooltip]="m + '.levelLabels' | translate"
                    (click)="setLevelLabels(!levelLabels())">
                    <mat-icon>text_rotation_none</mat-icon>
                  </button>
                </div>

                <!-- Zoom, bottom right. -->
                <div
                  class="float zoom"
                  role="group"
                  [attr.aria-label]="m + '.zoom' | translate"
                  [class.beside-panel]="panelOpen()">
                  <button
                    type="button"
                    class="tool"
                    data-cy="ontology-map-zoom-in"
                    [attr.aria-label]="m + '.zoomIn' | translate"
                    [matTooltip]="m + '.zoomIn' | translate"
                    matTooltipPosition="left"
                    (click)="graphView()?.zoomBy(1.25)">
                    <mat-icon>add</mat-icon>
                  </button>
                  <button
                    type="button"
                    class="tool"
                    data-cy="ontology-map-zoom-out"
                    [attr.aria-label]="m + '.zoomOut' | translate"
                    [matTooltip]="m + '.zoomOut' | translate"
                    matTooltipPosition="left"
                    (click)="graphView()?.zoomBy(0.8)">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="divider"></span>
                  <button
                    type="button"
                    class="tool"
                    data-cy="ontology-map-fit"
                    [attr.aria-label]="m + '.fit' | translate"
                    [matTooltip]="m + '.fit' | translate"
                    matTooltipPosition="left"
                    (click)="graphView()?.fit()">
                    <mat-icon>fit_screen</mat-icon>
                  </button>
                </div>
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
              } @else if (propertyPanelIri(); as propertyIri) {
                <app-property-panel
                  class="panel"
                  [graph]="graph"
                  [propertyIri]="propertyIri"
                  [colors]="colors()"
                  [dataModelLabel]="selected.label"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  [canEdit]="canEdit() ?? false"
                  (classSelected)="openPanel($event)"
                  (closed)="openPanel(undefined)"
                  (filter)="setPropertyFilter([$event])"
                  (edit)="editProperty($event)" />
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
      }

      // The map's box, edge to edge: the toolbar on top, then the map and, when a class is open, its panel beside it.
      .canvas {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: $cool_gray_50;
        overflow: hidden;
      }

      // Controls float over the graph, in its corners, as in a map app; the graph keeps the whole box.
      .float {
        position: absolute;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 4px;
        background: white;
        border: 1px solid $cool_gray_200;
        border-radius: 24px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      }

      .filters {
        top: 16px;
        left: 16px;
        max-width: calc(100% - 32px);
        flex-wrap: wrap;
        gap: 4px 6px;
      }

      .display {
        top: 16px;
        right: 16px;
      }

      .zoom {
        right: 16px;
        bottom: 16px;
        flex-direction: column;
        border-radius: 12px;

        .divider {
          width: 22px;
          height: 1px;
          margin: 2px 0;
        }
      }

      // An open panel covers the right of the graph; the controls there move to its left.
      .beside-panel {
        right: calc(min(440px, 50%) + 16px);
      }

      .divider {
        flex: none;
        width: 1px;
        height: 22px;
        margin: 0 4px;
        background: $cool_gray_200;
      }

      .data-model {
        --mat-button-text-container-height: 32px;
        --mat-button-text-container-shape: 16px;
        font-weight: 500;
        white-space: nowrap;

        &.static {
          padding: 0 12px;
          font-size: 14px;
        }
      }

      .counts {
        padding-right: 6px;
        white-space: nowrap;
        font-size: 12px;
        color: $cool_gray_500;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        height: 32px;
        border: 1px solid $cool_gray_300;
        border-radius: 16px;
        white-space: nowrap;

        &.active {
          border-color: $primary;
          background: $primary_50;
          color: $primary;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        // "Class: Person", the chosen value after the filter's name.
        b {
          // Against the trigger's gap, so the colon follows the name.
          margin-left: -4px;
          font-weight: 500;

          &::before {
            content: ': ';
            font-weight: 400;
          }
        }
      }

      .chip-trigger,
      .chip-clear,
      .tool {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        background: none;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      .chip-trigger {
        gap: 4px;
        height: 100%;
        padding: 0 4px 0 10px;
        font-size: 13px;

        .drop {
          margin-left: -2px;
          color: $cool_gray_500;
        }
      }

      .chip.active .chip-trigger {
        padding-right: 2px;
      }

      .chip-clear {
        width: 20px;
        height: 20px;
        margin-right: 6px;
        border-radius: 50%;
        background: rgba(51, 103, 144, 0.12);

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .tool {
        width: 32px;
        height: 32px;
        border-radius: 16px;
        color: $cool_gray_600;

        &:hover {
          background: $cool_gray_100;
        }

        &.on {
          background: $primary_50;
          color: $primary;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      // Text sizes read as one letter, drawn at three sizes.
      .size {
        font-weight: 500;

        &[data-size='small'] {
          font-size: 12px;
        }

        &[data-size='normal'] {
          font-size: 16px;
        }

        &[data-size='large'] {
          font-size: 20px;
        }
      }

      .body {
        position: relative;
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

      .filter-check {
        margin-right: 8px;
      }

      .link-count {
        margin-left: 8px;
        font-size: 12px;
        color: $cool_gray_500;
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
  /** The graph view's data model: subclasses carry the links they inherit, with no subclass arrows. */
  private readonly _graphLinks = computed(() => {
    const graph = this.graph();
    return graph ? withInheritedLinks(graph) : undefined;
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
  /** The Cytoscape graph; the Map view is no longer offered and is to be removed. */
  readonly view = signal<OntologyMapView>('graph');
  /** How the graph view arranges the classes; remembered in this browser. */
  readonly layout = signal<GraphLayout>(
    LAYOUTS.find(option => option.value === readStored(LAYOUT_KEY))?.value ?? 'circle'
  );
  readonly sizes = SIZES;
  /** How big the graph draws boxes, text and lines; remembered in this browser. */
  readonly size = signal<GraphSize>(SIZES.find(size => size === readStored(SIZE_KEY)) ?? 'normal');
  /** Whether the graph draws link labels level, rather than along their line; remembered in this browser. */
  readonly levelLabels = signal(readStored(LEVEL_LABELS_KEY) === 'true');
  readonly graphView = viewChild(OntologyGraphComponent);

  /** Whether cards show their summary or their properties; remembered in this browser. */
  readonly detail = signal<MapDetail>(readStored(DETAIL_KEY) === 'properties' ? 'properties' : 'summary');

  /** A colour per class of the data model, the same whatever the graph is filtered on. */
  readonly colors = computed(() => {
    const graph = this.graph();
    return graph ? classColors(graph) : new Map<string, string>();
  });

  /** In the Graph view, the classes to show with only the classes they are linked with; all classes when none. */
  readonly filterIris = computed(() => {
    const names = this._params()?.get(ONTOLOGY_MAP_PARAM.filter)?.split(',') ?? [];
    return names.map(name => this._classNamed(name)).filter((iri): iri is string => iri !== undefined);
  });
  readonly classOptions = computed(() =>
    (this.graph()?.nodes ?? [])
      .filter(node => node.kind === 'class')
      .map(node => ({ id: node.id, label: node.label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  /** The link properties of the data model, each once, with how many links use it. */
  readonly propertyOptions = computed(() => {
    const options = new Map<string, { id: string; label: string; links: number }>();
    for (const edge of this._graphLinks()?.edges ?? []) {
      if (edge.kind !== 'link' || edge.source === edge.target) continue;
      const option = options.get(edge.property) ?? { id: edge.property, label: edge.label, links: 0 };
      option.links++;
      options.set(edge.property, option);
    }
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
  });
  /** In the Graph view, the properties to show only the links of; used instead of the class filter. */
  readonly propertyIris = computed(() => {
    const names = this._params()?.get(ONTOLOGY_MAP_PARAM.property)?.split(',') ?? [];
    return this.propertyOptions()
      .filter(option => names.includes(classNameOf(option.id)))
      .map(option => option.id);
  });
  readonly propertyLabel = computed(
    () => this.propertyOptions().find(option => option.id === this.propertyIris()[0])?.label
  );

  /** The name of the one class filtered on. */
  readonly filterLabel = computed(() => this.classOptions().find(option => option.id === this.filterIris()[0])?.label);
  /** What the Graph view draws: the data model, narrowed to the filtered classes and the classes they are linked with. */
  readonly graphShown = computed(() => {
    const graph = this._graphLinks();
    if (!graph) return undefined;
    const properties = this.propertyIris();
    return properties.length > 0 ? throughProperties(graph, properties) : linkedWith(graph, this.filterIris());
  });

  /** A property hovered in the class panel; the graph highlights its links. */
  readonly hoveredProperty = signal<string | undefined>(undefined);

  constructor() {
    // A panel that changes class, or closes, under the pointer never reports the pointer leaving its rows.
    effect(() => {
      this.panelIri();
      this.propertyPanelIri();
      untracked(() => this.hoveredProperty.set(undefined));
    });
  }

  /** Whether a class or property panel covers the right of the graph. */
  readonly panelOpen = computed(() => !!(this.panelIri() || this.propertyPanelIri()));

  /** The class whose panel is open. */
  readonly panelIri = computed(() => this._classFromUrl(ONTOLOGY_MAP_PARAM.panel));
  /** The link property whose panel is open, in the Graph view; none while a class panel is open. */
  readonly propertyPanelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    if (!name || this.panelIri() || this.view() !== 'graph') return undefined;
    return this._graphLinks()?.edges.find(edge => edge.kind === 'link' && classNameOf(edge.property) === name)
      ?.property;
  });
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

  /** Opens the class's panel, or closes whichever panel is open; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._navigate({
      [ONTOLOGY_MAP_PARAM.panel]: classIri ? classNameOf(classIri) : null,
      [ONTOLOGY_MAP_PARAM.propertyPanel]: null,
    });
  }

  /** Opens the link property's panel instead of a class's; a step in the browser history. */
  openPropertyPanel(propertyIri: string): void {
    this._navigate({ [ONTOLOGY_MAP_PARAM.propertyPanel]: classNameOf(propertyIri), [ONTOLOGY_MAP_PARAM.panel]: null });
  }

  /** Filters the graph on these classes, or shows every class when none; a step in the browser history. */
  setFilter(classIris: readonly string[]): void {
    this._navigate({
      [ONTOLOGY_MAP_PARAM.filter]: classIris.length ? classIris.map(classNameOf).join(',') : null,
      // Filtering by class or by property, never both.
      [ONTOLOGY_MAP_PARAM.property]: null,
    });
  }

  /** Shows only the links through these properties, or every class when none; a step in the browser history. */
  setPropertyFilter(propertyIris: readonly string[]): void {
    this._navigate({
      [ONTOLOGY_MAP_PARAM.property]: propertyIris.length ? propertyIris.map(classNameOf).join(',') : null,
      [ONTOLOGY_MAP_PARAM.filter]: null,
    });
  }

  /** Adds the property to the filter, or takes it out. */
  toggleProperty(propertyIri: string): void {
    const chosen = this.propertyIris();
    this.setPropertyFilter(
      chosen.includes(propertyIri) ? chosen.filter(iri => iri !== propertyIri) : [...chosen, propertyIri]
    );
  }

  /** Shows every class again, whichever filter was on. */
  clearFilters(): void {
    this._navigate({ [ONTOLOGY_MAP_PARAM.filter]: null, [ONTOLOGY_MAP_PARAM.property]: null });
  }

  /** Adds the class to the filter, or takes it out. */
  toggleFilter(classIri: string): void {
    const chosen = this.filterIris();
    this.setFilter(chosen.includes(classIri) ? chosen.filter(iri => iri !== classIri) : [...chosen, classIri]);
  }

  /** Shows the class alone with the classes it is linked with, in the Graph view. */
  filterOn(classIri: string): void {
    this.setView('graph');
    this.setFilter([classIri]);
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
    return name ? this._classNamed(name) : undefined;
  }

  private _classNamed(name: string): string | undefined {
    return this.graph()?.nodes.find(node => node.kind === 'class' && classNameOf(node.id) === name)?.id;
  }

  setSize(size: GraphSize): void {
    this.size.set(size);
    store(SIZE_KEY, size);
  }

  setLevelLabels(level: boolean): void {
    this.levelLabels.set(level);
    store(LEVEL_LABELS_KEY, String(level));
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
    this._openEditor(iri, RouteConstants.classes);
  }

  /** Opens the property's data model in the data model editor, on its properties. */
  editProperty(iri: string): void {
    this._openEditor(iri, RouteConstants.properties);
  }

  private _openEditor(iri: string, page: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(
      ['..', RouteConstants.ontology, OntologyService.getOntologyNameFromIri(ontologyIri), RouteConstants.editor, page],
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
