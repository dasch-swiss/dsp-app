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
import { TranslatePipe } from '@ngx-translate/core';
import type { Core, StylesheetJson } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { linkCounts, mainClass } from '../sidenav/data-model-map/data-model-importance';
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

/** The share of the chosen name size a model is first shown at, at least, though it then does not fit. */
const READABLE_SHARE = 0.8;

/** Names are code: they are written in a monospaced font. */
const FONT = { labels: 'Roboto, sans-serif', names: 'Roboto Mono, ui-monospace, monospace' };

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
  imports: [TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    <div #canvas class="canvas" data-cy="ontology-graph"></div>
    @if (failed()) {
      <p class="failed">{{ 'pages.ontologyMap.graphFailed' | translate }}</p>
    }
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
    @if (hoveredLink(); as link) {
      <div
        class="link-tip"
        role="tooltip"
        data-cy="ontology-graph-link-tip"
        [style.left.px]="link.x"
        [style.top.px]="link.y">
        <b>{{ link.label }}</b>
        <code>{{ link.name }}</code>
        <span class="hint">{{ link.from }} → {{ link.to }} · {{ 'pages.ontologyMap.linkTipHint' | translate }}</span>
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

      // A hovered link's label, name and ends, below the pointer.
      .link-tip {
        position: absolute;
        z-index: 1;
        transform: translate(-50%, 16px);
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 6px;
        background: #1f2937;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        color: white;
        font: 400 12px/16px var(--font-sans, Roboto, sans-serif);
        white-space: nowrap;
        pointer-events: none;

        b {
          font-weight: 500;
        }

        code {
          font-family: 'Roboto Mono', ui-monospace, monospace;
          color: #cbd5e1;
        }

        .hint {
          color: #94a3b8;
        }
      }

      .legend-dashed {
        width: 18px;
        height: 12px;
        box-sizing: border-box;
        border: 1px dashed #bdbfc1;
        border-radius: 3px;
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
  /** The link under the pointer, for its tooltip: its texts and ends, and where to show it in the box. */
  readonly hoveredLink = signal<
    { label: string; name: string; from: string; to: string; x: number; y: number } | undefined
  >(undefined);
  /** Whether the user moved classes since the last layout; their places then survive a resize. */
  private _dragged = false;
  /** The layout, classes and links last laid out, to tell a new model from the same one handed over again. */
  private _shown = '';
  /** How much bigger than at scale 1 boxes, text and lines are drawn; see `graphScale`. */
  private _scale = 1;

  private readonly _counts = computed(() => linkCounts(this.graph()));
  private readonly _elements = computed(() =>
    toGraphElements(this.graph(), {
      colors: this.colors(),
      mainIri: mainClass(this._counts())?.id,
      selectedIri: this.selectedIri(),
      anyResourceLabel: this.anyResourceLabel(),
    })
  );
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
          const edge = event.target;
          this._hoveredProperty.set(edge.data('property'));
          this.hoveredLink.set({
            label: edge.data('label'),
            name: edge.data('name'),
            from: edge.source().data('label'),
            to: edge.target().data('label'),
            ...event.renderedPosition,
          });
          container.style.cursor = 'pointer';
        });
        cy.on('mouseout', 'edge', () => {
          this._hoveredProperty.set(undefined);
          this.hoveredLink.set(undefined);
          container.style.cursor = '';
        });
        // A tooltip left behind would cover what is panned or zoomed under it.
        cy.on('viewport', () => this.hoveredLink.set(undefined));
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
    cy.layout(layoutOptions(layout) as never).run();
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
    this._fit(cy);
    const readable = (textSize * READABLE_SHARE) / (BASE_FONT_SIZE * this._scale);
    if (cy.zoom() < readable) {
      cy.zoom(readable);
      cy.center();
    }
  }

  /** Fits the whole model in the box, zooming in no further than the chosen size of class names. */
  private _fit(cy: Core): void {
    cy.fit(undefined, FIT_PADDING);
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
