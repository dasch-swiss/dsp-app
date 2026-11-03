import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import type { Core, NodeSingular, StylesheetJson } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { linkCounts, mainClass } from '../sidenav/data-model-map/data-model-importance';
import { arrangeIslands, ClassFamily, CytoscapeFactory, FILE_KINDS, ISLAND_PADDING } from './islands';
import {
  BASE_FONT_SIZE,
  GRAPH_TEXT_SIZE,
  GraphLabels,
  GraphLayout,
  graphScale,
  GraphSize,
  layoutOptions,
  toGraphElements,
} from './ontology-graph-elements';

/** The DSP-APP palette, as the canvas needs literal colours. */
const COLOR = {
  primary: '#336790',
  line: '#A7AAAD',
  border: '#BDBFC1',
  text: '#1F2937',
  muted: '#6B7280',
};

/** Room left around the model when it is fitted, clear of the legend at the bottom. */
const FIT_PADDING = 56;

const edgeKey = (edge: DataModelGraph['edges'][number]) => `${edge.source}>${edge.property}>${edge.target}`;

/** What a PNG of the graph covers: the part in view, or every class shown. */
export type GraphExportArea = 'view' | 'whole';

/** PNGs are drawn at twice the screen's resolution, sharp on slides and in print. */
const EXPORT_SCALE = 2;
/** The graph's background, as on screen; a transparent PNG would lose the link labels' backing. */
const EXPORT_BACKGROUND = '#F9FAFB';
/** The whole model of a big data model is drawn no bigger than this, in px each way. */
const EXPORT_MAX_SIZE = 8000;

/** How far apart, at most, classes are spread to fill the box; past it, links grow too long to follow. */
const MAX_SPREAD = 2.5;

/** The share of the chosen name size a model is first shown at, at least, though it then does not fit. */
const READABLE_SHARE = 0.6;

/** Names are code: they are written in a monospaced font. */
const FONT = { labels: 'Roboto, sans-serif', names: 'Roboto Mono, ui-monospace, monospace' };

/** An empty image, for a class box with only one of its two images: a texture and a file icon. */
const NO_IMAGE =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%2F%3E';

/** A file icon in a class's box, at scale 1: its size, its gap from the box's left edge, and the room it takes. */
const ICON = { size: 26, inset: 12, room: 28 };

let measuring: CanvasRenderingContext2D | null | undefined;

/** How wide a text is drawn in a font, its longest line for a text on several lines. */
function textWidth(text: string, font: string): number {
  measuring ??= document.createElement('canvas').getContext('2d');
  if (!measuring) return text.length * 9;
  measuring.font = font;
  return Math.max(...text.split('\n').map(line => measuring!.measureText(line).width));
}

/**
 * Stores, on every class with a file icon, how wide its box is at scale 1 for each of its texts: its label and the
 * icon's room. The graph cannot widen a box for an icon by itself.
 */
function measureIconBoxes(cy: Core): void {
  cy.nodes('[icon]').forEach(node => {
    const weight = node.hasClass('sub') ? 500 : 600;
    for (const key of ['labels', 'names', 'both'] as const) {
      const font = `${weight} ${BASE_FONT_SIZE}px ${key === 'names' ? FONT.names : FONT.labels}`;
      node.data(`${key}Width`, textWidth(node.data(DATA_KEY[key]) ?? '', font) + ICON.room);
    }
  });
}

/** The element data each `GraphLabels` writes, by key. */
const DATA_KEY: Record<GraphLabels, string> = { labels: 'label', names: 'name', both: 'both' };

/** The element data each `GraphLabels` writes. */
const LABEL_DATA: Record<GraphLabels, string> = { labels: 'data(label)', names: 'data(name)', both: 'data(both)' };

/** How the graph writes and turns its texts. */
export interface GraphTextOptions {
  /** Whether link labels are drawn level, rather than along their line. */
  levelLabels: boolean;
  labels: GraphLabels;
}

/** The graph's stylesheet, boxes, text and lines scaled by `f`, its texts written as `text` says. */
const styleFor = (f: number, text: GraphTextOptions): StylesheetJson => [
  {
    selector: 'node',
    style: {
      shape: 'round-rectangle',
      label: LABEL_DATA[text.labels],
      'text-wrap': 'wrap',
      'text-max-width': '1000px',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': text.labels === 'names' ? FONT.names : FONT.labels,
      'font-size': BASE_FONT_SIZE * f,
      'font-weight': 500,
      color: COLOR.text,
      width: 'label',
      height: 'label',
      padding: `${16 * f}px`,
      'background-color': 'data(color)',
      'border-width': f,
      'border-color': COLOR.muted,
    },
  },
  {
    selector: 'node.external',
    style: {
      'background-color': '#FFFFFF',
      'border-style': 'dashed',
      'border-color': COLOR.border,
      color: COLOR.muted,
      'font-style': 'italic',
    },
  },
  // Islands view: a family's top class has a strong border in its hue, its subclasses a thin one.
  {
    selector: 'node.family-member',
    style: { 'border-width': 2 * f, 'border-color': 'data(dark)', 'font-weight': 600 },
  },
  { selector: 'node.family-member.sub', style: { 'border-width': f, 'font-weight': 500 } },
  // A class with a file is widened for its icon, its label moved right to make room.
  {
    selector: 'node[icon]',
    style: {
      // Its width at scale 1, from `measureIconBoxes`, times `f`.
      width: `mapData(${text.labels}Width, 0, 10000, 0, ${10000 * f})`,
      'text-margin-x': (ICON.room * f) / 2,
    },
  },
  {
    selector: 'node[icon], node[texture]',
    style: {
      'background-image': (node: NodeSingular) =>
        `${node.data('texture') ?? NO_IMAGE} ${node.data('icon') ?? NO_IMAGE}` as never,
      'background-fit': 'none none' as never,
      'background-clip': 'node none' as never,
      'background-width': `auto ${ICON.size * f}px` as never,
      'background-height': `auto ${ICON.size * f}px` as never,
      // From the box's left edge, about as far as from its top.
      'background-position-x': `50% ${ICON.inset * f}px` as never,
      'background-position-y': `50% 50%` as never,
    },
  },
  {
    selector: 'node.island',
    style: {
      shape: 'round-rectangle',
      'background-color': '#FFFFFF',
      'background-opacity': 0.6,
      'border-width': 1.5 * f,
      'border-style': 'dashed',
      'border-color': '#CBD5E1',
      padding: `${ISLAND_PADDING * f}px`,
      'text-valign': 'top',
      'text-halign': 'center',
      'font-family': FONT.labels,
      'font-size': 14 * f,
      'font-weight': 500,
      'font-style': 'normal',
      color: '#334155',
      'text-margin-y': -6 * f,
    },
  },
  {
    selector: 'node.family',
    style: {
      shape: 'round-rectangle',
      'background-color': 'data(color)',
      'background-opacity': 0.25,
      'border-width': f,
      'border-color': 'data(dark)',
      'border-opacity': 0.25,
      padding: `${12 * f}px`,
      'text-valign': 'top',
      'text-halign': 'center',
      'font-family': FONT.labels,
      'font-size': 11 * f,
      'font-weight': 600,
      'text-transform': 'uppercase',
      color: 'data(dark)',
      'text-margin-y': -3 * f,
    },
  },
  // A lone island is only there for the layout: no frame, and clicks go through to the background.
  {
    selector: 'node.island.alone',
    style: { 'background-opacity': 0, 'border-width': 0, padding: '0px', events: 'no' },
  },
  { selector: 'node.main', style: { 'border-width': 2 * f, 'border-color': COLOR.text } },
  { selector: 'node.selected', style: { 'border-width': 3 * f, 'border-color': COLOR.primary } },
  { selector: 'node:active', style: { 'overlay-opacity': 0.08, 'overlay-color': COLOR.primary } },
  {
    selector: 'edge',
    style: {
      width: 1.2 * f,
      'curve-style': 'bezier',
      'line-color': COLOR.line,
      'target-arrow-shape': 'triangle',
      'target-arrow-color': COLOR.line,
      'arrow-scale': 0.8 * f,
      label: LABEL_DATA[text.labels],
      'text-wrap': 'wrap',
      'text-max-width': '1000px',
      'font-family': text.labels === 'names' ? FONT.names : FONT.labels,
      // Link labels close to class names in size, so a property reads as easily as the classes it joins.
      'font-size': 13 * f,
      color: COLOR.text,
      'text-rotation': text.levelLabels ? 'none' : 'autorotate',
      'text-background-color': '#F9FAFB',
      'text-background-opacity': 0.9,
      'text-background-padding': '1px',
      // Labels give way when zoomed out, so a big model stays readable.
      'min-zoomed-font-size': 7,
    },
  },
  {
    selector: 'edge.highlighted, edge.same-property',
    style: { width: 2 * f, 'line-color': COLOR.primary, 'target-arrow-color': COLOR.primary, color: COLOR.primary },
  },
];

/**
 * The data model as an interactive graph, drawn with Cytoscape.js (loaded only when the graph is shown): a node per
 * class, labelled arrows for the links, a choice of layouts, dragging, zooming and panning.
 */
@Component({
  selector: 'app-ontology-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @let i = 'pages.ontologyMap.islands';
    <div #canvas class="canvas" data-cy="ontology-graph"></div>
    @if (failed()) {
      <p class="failed">{{ 'pages.ontologyMap.graphFailed' | translate }}</p>
    }
    @if (islandsLegend(); as legend) {
      <div #islandsLegend class="islands-legend" role="region" [attr.aria-label]="i + '.legend' | translate">
        <div class="legend-head">
          <span class="legend-title">{{ i + '.legend' | translate }}</span>
          <span class="spacer"></span>
          <button
            type="button"
            class="legend-toggle"
            data-cy="islands-legend-toggle"
            [attr.aria-expanded]="legendOpen()"
            [attr.aria-label]="i + (legendOpen() ? '.collapse' : '.expand') | translate"
            (click)="legendOpen.set(!legendOpen())">
            <mat-icon>{{ legendOpen() ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
        </div>
        @if (legendOpen()) {
          <div class="legend-body">
            @if (legend.files.length) {
              <div class="legend-files">
                <span class="legend-heading">{{ i + '.files' | translate }}</span>
                @for (file of legend.files; track file.representation) {
                  <span class="file"
                    ><span class="file-icon"
                      ><mat-icon>{{ file.icon }}</mat-icon></span
                    >{{ i + '.fileKinds.' + file.representation | translate }}</span
                  >
                }
              </div>
            }
            <div class="legend-shapes">
              <span class="legend-heading">{{ i + '.shapes' | translate }}</span>
              <span class="shape"><span class="shape-box parent"></span>{{ i + '.parent' | translate }}</span>
              <span class="shape"><span class="shape-box sub"></span>{{ i + '.subclass' | translate }}</span>
              <span class="shape"
                ><span class="shape-box other"></span>{{ 'pages.ontologyMap.legendDashed' | translate }}</span
              >
              <span class="shape">
                <svg width="26" height="8" viewBox="0 0 28 8" aria-hidden="true">
                  <path class="legend-line" d="M 0 4 L 22 4" />
                  <path class="arrowhead" d="M 21 1 L 27 4 L 21 7 Z" />
                </svg>
                {{ i + '.link' | translate }}
              </span>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="legend" aria-hidden="true">
        <span class="legend-item">
          <svg width="28" height="8" viewBox="0 0 28 8">
            <path class="legend-line" d="M 0 4 L 22 4" />
            <path class="arrowhead" d="M 21 1 L 27 4 L 21 7 Z" />
          </svg>
          {{ t + '.legendLink' | translate }}
        </span>
        <span class="legend-item"
          ><span class="legend-dashed"></span>{{ 'pages.ontologyMap.legendDashed' | translate }}</span
        >
      </div>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        position: relative;
        display: block;
        height: 100%;
      }

      .canvas {
        position: absolute;
        inset: 0;
      }

      .failed {
        position: absolute;
        top: 16px;
        left: 16px;
        margin: 0;
        color: $cool_gray_500;
      }

      .legend {
        position: absolute;
        left: 16px;
        bottom: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 6px 10px;
        border: 1px solid #ebebeb;
        border-radius: 4px;
        background: white;
        font: 400 11px/16px var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_600;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .legend-line {
        fill: none;
        stroke: #a7aaad;
        stroke-width: 1.5;
      }

      .arrowhead {
        fill: #a7aaad;
      }

      .legend-dashed {
        width: 18px;
        height: 12px;
        box-sizing: border-box;
        border: 1px dashed #bdbfc1;
        border-radius: 3px;
      }

      // The Islands view's legend: the kinds of file shown, and the shapes.
      .islands-legend {
        position: absolute;
        left: 16px;
        bottom: 16px;
        max-width: calc(100% - 96px);
        box-sizing: border-box;
        padding: 10px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: white;
        border: 1px solid $cool_gray_200;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
        font: 400 12.5px/1.3 var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_800;
      }

      .legend-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .legend-title {
        font-size: 13px;
        font-weight: 600;
        color: $cool_gray_900;
      }

      .spacer {
        flex: 1;
      }

      .legend-toggle {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: 13px;
        background: transparent;
        color: $cool_gray_500;
        cursor: pointer;

        &:hover {
          background: $cool_gray_100;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .legend-body {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 24px;
        align-items: flex-start;
      }

      .legend-heading {
        display: block;
        padding: 0 6px 4px 0;
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .legend-files,
      .legend-shapes {
        flex: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .file,
      .shape {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 22px;
      }

      .file-icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        background: $cool_gray_100;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
          color: $cool_gray_600;
        }
      }

      .shape-box {
        width: 26px;
        height: 14px;
        box-sizing: border-box;
        border-radius: 3px;

        &.parent {
          border: 2px solid $cool_gray_600;
          background: $cool_gray_300;
        }

        &.sub {
          border: 1px solid $cool_gray_400;
          background: $cool_gray_200;
        }

        &.other {
          border: 1.5px dashed $cool_gray_400;
          background: white;
        }
      }
    `,
  ],
})
export class OntologyGraphComponent {
  /** The data model to draw. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class to outline, if any. */
  readonly selectedIri = input<string | undefined>(undefined);
  /** How the classes are arranged. */
  readonly layout = input<GraphLayout>('circle');
  /** Colour per class, from the whole data model so a filter keeps them; see `classColors`. */
  readonly colors = input.required<Map<string, string>>();
  /** How big boxes, text and lines are drawn. */
  readonly size = input<GraphSize>('normal');
  /** Whether link labels are drawn level, rather than along their line. */
  readonly levelLabels = input(false);
  /** Whether classes and links are written with their labels, their names, or both. */
  readonly labels = input<GraphLabels>('labels');
  /** A property to highlight every link of, such as one hovered in the class panel. */
  readonly highlightedProperty = input<string | undefined>(undefined);
  /** Label for knora-api's "any resource" node, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** The family of every class of the data model, for the Islands view; see `classFamilies`. */
  readonly families = input<Map<string, ClassFamily> | undefined>(undefined);

  /** A class of this project was clicked; emits its IRI. */
  readonly classSelected = output<string>();
  /** A class of this data model was double-clicked; emits its IRI, to show it with the classes it is linked with. */
  readonly classFiltered = output<string>();
  /** A link was clicked; emits its property IRI. */
  readonly propertySelected = output<string>();
  /** The background, not a class or a link, was clicked. */
  readonly backgroundClicked = output<void>();

  private readonly _canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly _cy = signal<Core | undefined>(undefined);
  readonly failed = signal(false);
  private readonly _hoveredProperty = signal<string | undefined>(undefined);
  /** Whether the user moved classes since the last layout; their places then survive a resize. */
  private _dragged = false;
  /** The layout, classes and links last laid out, to tell a new model from the same one handed over again. */
  private _shown = '';
  /** The Cytoscape factory, once loaded, for layouts run apart from the graph shown. */
  private _cytoscape?: CytoscapeFactory;
  /** How much bigger than at scale 1 boxes, text and lines are drawn; see `graphScale`. */
  private _scale = 1;

  private readonly _counts = computed(() => linkCounts(this.graph()));
  private readonly _islands = computed(() => {
    const families = this.families();
    if (this.layout() !== 'islands' || !families) return undefined;
    return { families };
  });
  private readonly _elements = computed(() =>
    toGraphElements(this.graph(), {
      colors: this.colors(),
      mainIri: mainClass(this._counts())?.id,
      selectedIri: this.selectedIri(),
      anyResourceLabel: this.anyResourceLabel(),
      islands: this._islands(),
    })
  );

  /** Whether the Islands view's legend is open. */
  readonly legendOpen = signal(true);
  private readonly _legend = viewChild<ElementRef<HTMLElement>>('islandsLegend');

  /** What the Islands view's legend lists: the kinds of file the classes shown carry. */
  readonly islandsLegend = computed(() => {
    if (!this._islands()) return undefined;
    const files = new Set(this.graph().nodes.map(node => node.representationClass));
    return { files: FILE_KINDS.filter(kind => files.has(kind.representation)) };
  });
  /** Classes the user may open; other data models' classes and knora-api's are drawn but not clickable. */
  private readonly _navigable = computed(
    () =>
      new Set(
        this.graph()
          .nodes.filter(node => node.navigable && node.kind === 'class')
          .map(node => node.id)
      )
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      try {
        const { default: cytoscape } = await import('cytoscape');
        this._cytoscape = cytoscape as unknown as CytoscapeFactory;
        const cy = cytoscape({
          container: this._canvas().nativeElement,
          style: this._style(1),
          minZoom: 0.05,
          maxZoom: 3,
          wheelSensitivity: 0.3,
        });
        cy.on('tap', event => {
          if (event.target === cy) this.backgroundClicked.emit();
        });
        cy.on('tap', 'node', event => {
          const id = event.target.id();
          if (this._navigable().has(id)) this.classSelected.emit(id);
        });
        cy.on('dbltap', 'node', event => {
          const id = event.target.id();
          if (this._navigable().has(id)) this.classFiltered.emit(id);
        });
        cy.on('tap', 'edge.link', event => this.propertySelected.emit(event.target.data('property')));
        cy.on('dragfree', 'node', () => (this._dragged = true));
        // Hovering a class highlights its links; a class that opens on click shows a link's pointer.
        const container = this._canvas().nativeElement;
        cy.on('mouseover', 'node', event => {
          event.target.connectedEdges().addClass('highlighted');
          if (this._navigable().has(event.target.id())) container.style.cursor = 'pointer';
        });
        cy.on('mouseout', 'node', event => {
          event.target.connectedEdges().removeClass('highlighted');
          container.style.cursor = '';
        });
        // Hovering a link highlights every link through the same property, wherever it is used; a click opens it.
        cy.on('mouseover', 'edge', event => {
          this._hoveredProperty.set(event.target.data('property'));
          container.style.cursor = 'pointer';
        });
        cy.on('mouseout', 'edge', () => {
          this._hoveredProperty.set(undefined);
          container.style.cursor = '';
        });
        // The canvas follows its box, which settles after the page first renders and narrows when the class panel
        // opens beside it. Layouts spread the classes over the box, so a new size lays them out again, unless the
        // user has dragged some, whose places are then kept and only fitted.
        let frame = 0;
        const observer = new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            cy.resize();
            if (this._dragged) {
              this._fit(cy);
            } else {
              this._arrange(cy);
            }
          });
        });
        observer.observe(this._canvas().nativeElement);
        destroyRef.onDestroy(() => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          cy.destroy();
        });
        this._cy.set(cy);
      } catch (error) {
        console.error('Error loading the graph view:', error);
        this.failed.set(true);
      }
    });

    // Other classes or links replace every element and lay them out again; a new outline only restyles. The same
    // classes and links, handed over again, change nothing: places the user dragged and the view stay.
    effect(() => {
      const cy = this._cy();
      const graph = this.graph();
      const layout = this.layout();
      if (!cy) return;
      const shown = `${layout} ${graph.nodes.map(node => node.id).join(' ')} ${graph.edges.map(edgeKey).join(' ')}`;
      if (shown === this._shown) return;
      this._shown = shown;
      cy.elements().remove();
      cy.add(untracked(() => this._elements()));
      measureIconBoxes(cy);
      this._arrange(cy, layout);
    });
    effect(() => {
      const cy = this._cy();
      const property = this._hoveredProperty() ?? this.highlightedProperty();
      if (!cy) return;
      cy.edges().removeClass('same-property');
      if (property)
        cy.edges()
          .filter(edge => edge.data('property') === property)
          .addClass('same-property');
    });
    // A new size rescales in place: classes stay where they are, only boxes, text and lines grow or shrink.
    effect(() => {
      const cy = this._cy();
      this.size();
      if (cy) this._rescale(cy);
    });
    // New texts restyle in place: classes stay where they are, their boxes fitting the new texts.
    effect(() => {
      const cy = this._cy();
      const text = { levelLabels: this.levelLabels(), labels: this.labels() };
      if (cy) cy.style(styleFor(this._scale, text));
    });
    effect(() => {
      const cy = this._cy();
      const selected = this.selectedIri();
      if (!cy) return;
      cy.nodes().removeClass('selected');
      if (selected) cy.getElementById(selected).addClass('selected');
    });
  }

  /** Lays the classes out over the whole box and fits them in it; dragged places are forgotten. */
  private _arrange(cy: Core, layout = untracked(() => this.layout())): void {
    if (cy.elements().empty()) return;
    // Lay out at scale 1, so the scale changes how big things are drawn, not how far apart they are.
    cy.style(this._style(1));
    if (layout === 'islands') {
      arrangeIslands(cy, this._cytoscape!, 1, this._aspect(cy));
    } else {
      cy.layout(layoutOptions(layout) as never).run();
    }
    this._dragged = false;
    this._rescale(cy);
  }

  /**
   * Scales boxes, text and lines so class names read at the chosen size once the model is fitted: a model of many
   * classes, fitted at a low zoom, is drawn bigger. Bigger boxes widen the model, so the scale is measured twice.
   * A model too big to fit and stay readable is shown zoomed in on its middle, its names still readable; Fit shows it
   * all.
   */
  private _rescale(cy: Core): void {
    if (cy.elements().empty()) return;
    const textSize = GRAPH_TEXT_SIZE[untracked(() => this.size())];
    this._scale = 1;
    for (let pass = 0; pass < 2; pass++) {
      cy.style(this._style(this._scale));
      cy.fit(undefined, FIT_PADDING);
      this._scale = graphScale(textSize, cy.zoom());
    }
    cy.style(this._style(this._scale));
    // Islands are laid out again with the boxes as drawn, so families and classes stay clear of each other.
    if (untracked(() => this.layout()) === 'islands' && this._cytoscape) {
      arrangeIslands(cy, this._cytoscape, this._scale, this._aspect(cy));
    }
    this._spread(cy);
    this._fit(cy);
    const readable = (textSize * READABLE_SHARE) / (BASE_FONT_SIZE * this._scale);
    if (cy.zoom() < readable) {
      cy.zoom(readable);
      cy.center();
    }
  }

  /**
   * Spreads the classes apart, across and down each on its own, so the model fills the box instead of leaving room
   * to spare on a side: the side the fit leaves empty, or both when names reach their chosen size before it fits.
   * Boxes and text keep their size, only the room between them grows. A family's classes move together.
   */
  private _spread(cy: Core): void {
    const screen = this._room(cy);
    const before = cy.elements().boundingBox({});
    // The zoom the model is fitted at, at most the one that draws names at the chosen size.
    const zoom = Math.min(
      GRAPH_TEXT_SIZE[untracked(() => this.size())] / (BASE_FONT_SIZE * this._scale),
      screen.w / before.w,
      screen.h / before.h
    );
    const room = { w: screen.w / zoom, h: screen.h / zoom };
    const units = new Map<string, NodeSingular[]>();
    cy.nodes()
      .filter(node => !node.isParent())
      .forEach(node => {
        const family = node.parent().filter('.family');
        const key = family.nonempty() ? family.id() : node.id();
        units.set(key, [...(units.get(key) ?? []), node]);
      });
    if (units.size < 2) return;
    const centers = [...units.values()].map(nodes => ({
      nodes,
      x: nodes.reduce((sum, node) => sum + node.position('x'), 0) / nodes.length,
      y: nodes.reduce((sum, node) => sum + node.position('y'), 0) / nodes.length,
    }));
    const box = cy.elements().boundingBox({});
    const factor = (axis: 'x' | 'y', size: number, space: number) => {
      const values = centers.map(center => center[axis]);
      const span = Math.max(...values) - Math.min(...values);
      // The boxes at the edges take as much room as before; only the span between centres stretches.
      return span > 0 ? Math.min(MAX_SPREAD, Math.max(1, (space - (size - span)) / span)) : 1;
    };
    const fx = factor('x', box.w, room.w);
    const fy = factor('y', box.h, room.h);
    if (fx === 1 && fy === 1) return;
    const mid = { x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 };
    for (const { nodes, x, y } of centers) {
      const dx = (x - mid.x) * (fx - 1);
      const dy = (y - mid.y) * (fy - 1);
      for (const node of nodes) node.position({ x: node.position('x') + dx, y: node.position('y') + dy });
    }
  }

  /** The shape of the room the model is fitted in: its width over its height. */
  private _aspect(cy: Core): number {
    const room = this._room(cy);
    return room.h > 0 ? room.w / room.h : 16 / 9;
  }

  /** The room the model is fitted in, in screen pixels: the box less its padding and the Islands view's legend. */
  private _room(cy: Core): { w: number; h: number } {
    const legend = this._legend()?.nativeElement.offsetHeight ?? 0;
    return { w: cy.width() - 2 * FIT_PADDING, h: cy.height() - 2 * FIT_PADDING - legend };
  }

  /**
   * Fits the whole model in the box, clear of the Islands view's legend, zooming in no further than the chosen size of
   * class names.
   */
  private _fit(cy: Core): void {
    cy.fit(undefined, FIT_PADDING);
    const legend = this._legend()?.nativeElement.offsetHeight;
    if (legend) {
      const box = cy.elements().boundingBox({});
      const height = cy.height() - 2 * FIT_PADDING - legend;
      const zoom = Math.min(cy.zoom(), height / box.h);
      cy.zoom(zoom);
      cy.pan({
        x: (cy.width() - box.w * zoom) / 2 - box.x1 * zoom,
        y: FIT_PADDING + (height - box.h * zoom) / 2 - box.y1 * zoom,
      });
    }
    const zoom = GRAPH_TEXT_SIZE[untracked(() => this.size())] / (BASE_FONT_SIZE * this._scale);
    if (cy.zoom() > zoom) {
      cy.zoom(zoom);
      cy.center();
    }
  }

  private _style(f: number): StylesheetJson {
    return styleFor(
      f,
      untracked(() => ({ levelLabels: this.levelLabels(), labels: this.labels() }))
    );
  }

  /**
   * The graph as a PNG at twice the screen's resolution, on the graph's background: the part in view, or every class
   * shown; `undefined` before the graph has loaded.
   */
  png(area: GraphExportArea): Promise<Blob> | undefined {
    return this._cy()?.png({
      output: 'blob-promise',
      full: area === 'whole',
      // Cytoscape already draws at the screen's pixel ratio; the scale is against CSS pixels.
      scale: EXPORT_SCALE / (window.devicePixelRatio || 1),
      bg: EXPORT_BACKGROUND,
      maxWidth: area === 'whole' ? EXPORT_MAX_SIZE : undefined,
      maxHeight: area === 'whole' ? EXPORT_MAX_SIZE : undefined,
    });
  }

  /** Zooms in (`factor` above 1) or out, about the middle of the box. */
  zoomBy(factor: number): void {
    const cy = this._cy();
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }

  /** Zooms so the whole model fits. */
  fit(): void {
    const cy = this._cy();
    if (cy) this._fit(cy);
  }
}
