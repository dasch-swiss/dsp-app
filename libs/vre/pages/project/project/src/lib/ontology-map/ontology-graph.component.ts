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
import { GraphLayout, layoutOptions, toGraphElements } from './ontology-graph-elements';

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

const STYLE: StylesheetJson = [
  {
    selector: 'node',
    style: {
      shape: 'round-rectangle',
      label: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': 'Roboto, sans-serif',
      'font-size': 15,
      'font-weight': 500,
      color: COLOR.text,
      width: 'label',
      height: 'label',
      padding: '16px',
      'background-color': 'data(color)',
      'border-width': 1,
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
  { selector: 'node.unlinked', style: { 'border-style': 'dashed', 'border-color': COLOR.border } },
  { selector: 'node.main', style: { 'border-width': 2, 'border-color': COLOR.text } },
  { selector: 'node.selected', style: { 'border-width': 3, 'border-color': COLOR.primary } },
  { selector: 'node:active', style: { 'overlay-opacity': 0.08, 'overlay-color': COLOR.primary } },
  {
    selector: 'edge',
    style: {
      width: 1.2,
      'curve-style': 'bezier',
      'line-color': COLOR.line,
      'target-arrow-shape': 'triangle',
      'target-arrow-color': COLOR.line,
      'arrow-scale': 0.8,
      label: 'data(label)',
      'font-family': 'Roboto, sans-serif',
      'font-size': 10,
      color: COLOR.muted,
      'text-rotation': 'autorotate',
      'text-background-color': '#F9FAFB',
      'text-background-opacity': 0.9,
      'text-background-padding': '1px',
      // Labels give way when zoomed out, so a big model stays readable.
      'min-zoomed-font-size': 7,
    },
  },
  {
    selector: 'edge.subclass',
    style: { 'line-style': 'dashed', 'target-arrow-shape': 'triangle-backcurve', label: '' },
  },
  {
    selector: 'edge.highlighted',
    style: { width: 2, 'line-color': COLOR.primary, 'target-arrow-color': COLOR.primary, color: COLOR.primary },
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
    `,
  ],
})
export class OntologyGraphComponent {
  /** The data model to draw. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class to outline, if any. */
  readonly selectedIri = input<string | undefined>(undefined);
  /** How the classes are arranged. */
  readonly layout = input<GraphLayout>('tree');
  /** Colour per class, from the whole data model so a filter keeps them; see `classColors`. */
  readonly colors = input.required<Map<string, string>>();
  /** Label for knora-api's "any resource" node, in the current language. */
  readonly anyResourceLabel = input('Any resource');

  /** A class of this project was clicked; emits its IRI. */
  readonly classSelected = output<string>();
  /** A class of this data model was double-clicked; emits its IRI, to show it with the classes linking to it. */
  readonly classFiltered = output<string>();

  private readonly _canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly _cy = signal<Core | undefined>(undefined);
  readonly failed = signal(false);
  /** Whether the user moved classes since the last layout; their places then survive a resize. */
  private _dragged = false;

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
          style: STYLE,
          minZoom: 0.2,
          maxZoom: 3,
          wheelSensitivity: 0.3,
        });
        cy.on('tap', 'node', event => {
          const id = event.target.id();
          if (this._navigable().has(id)) this.classSelected.emit(id);
        });
        cy.on('dbltap', 'node', event => {
          const id = event.target.id();
          if (this._navigable().has(id)) this.classFiltered.emit(id);
        });
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
        // The canvas follows its box, which settles after the page first renders and narrows when the class panel
        // opens beside it. Layouts spread the classes over the box, so a new size lays them out again, unless the
        // user has dragged some, whose places are then kept and only fitted.
        let frame = 0;
        const observer = new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            cy.resize();
            if (this._dragged) {
              cy.fit(undefined, FIT_PADDING);
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

    // A new data model replaces every element and lays them out again; a new outline only restyles.
    effect(() => {
      const cy = this._cy();
      this.graph();
      const layout = this.layout();
      if (!cy) return;
      cy.elements().remove();
      cy.add(untracked(() => this._elements()));
      this._arrange(cy, layout);
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
    cy.layout(layoutOptions(layout) as never).run();
    cy.fit(undefined, FIT_PADDING);
    this._dragged = false;
  }

  /** Zooms so the whole model fits. */
  fit(): void {
    this._cy()?.fit(undefined, FIT_PADDING);
  }
}
