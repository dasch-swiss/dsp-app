import { DecimalPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelGraph, DataModelNode } from './data-model-graph';
import { linkCounts, linkTints, mainClass } from './data-model-importance';
import { DataModelLayout, layoutDataModel, PlacedNode } from './data-model-layout';

/** Above this many cards, cards show their name only. */
export const CONDENSED_ABOVE = 20;
/** Above this many cards, or below this width, only the header shows. */
export const HIDDEN_ABOVE = 60;
export const MIN_WIDTH = 160;
/** In the full map, cards are at least this wide; a row holds as many as fit, between 3 and 8. */
const FULL_CARD_WIDTH = 180;

const COLLAPSED_KEY = 'dsp-data-model-map-collapsed';

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * A small map of one data model: a card per class with its resource count, tinted by how many classes it is linked
 * with, and lines for the links between classes; the class being browsed is outlined.
 */
@Component({
  selector: 'app-data-model-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.full]': 'full()' },
  imports: [DecimalPipe, MatButton, MatIcon, MatIconButton, MatTooltip, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @if (!full()) {
      <div class="header">
        <span class="class-count">
          {{ t + (classCount() === 1 ? '.classCountOne' : '.classCount') | translate: { count: classCount() } }}
        </span>
        @if (fits()) {
          <button
            mat-icon-button
            class="toggle"
            data-cy="data-model-map-toggle"
            [attr.aria-expanded]="!collapsed()"
            [attr.aria-label]="t + (collapsed() ? '.expand' : '.collapse') | translate"
            [matTooltip]="t + (collapsed() ? '.expand' : '.collapse') | translate"
            (click)="toggleCollapsed()">
            <mat-icon>{{ collapsed() ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
        }
        <button
          mat-button
          class="full-map"
          type="button"
          data-cy="data-model-map-full-map"
          (click)="openFullMap.emit()">
          <mat-icon>open_in_full</mat-icon>{{ t + '.fullMap' | translate }}
        </button>
      </div>
    }

    @if (visibleLayout() && main(); as main) {
      @let mainNode = nodeById(main.id);
      <button type="button" class="main-class" data-cy="data-model-map-main-class" (click)="select(mainNode)">
        <mat-icon>hub</mat-icon>
        <span>
          <strong>{{ labelOf(mainNode) }}</strong>
          {{ t + '.mainClassLinks' | translate: { links: main.links, others: main.others } }}
        </span>
      </button>
    }

    @if (visibleLayout(); as layout) {
      <nav
        class="map"
        data-cy="data-model-map"
        [class.condensed]="condensed()"
        [attr.aria-label]="t + '.label' | translate"
        [style.height.px]="layout.height"
        (keydown)="onKeydown($event)">
        <span class="cdk-visually-hidden">
          {{ t + '.summary' | translate: { classes: classCount(), links: graph().edges.length } }}
        </span>
        <svg class="edges" aria-hidden="true" [attr.width]="layout.width" [attr.height]="layout.height">
          @for (routed of orderedEdges(); track $index) {
            <path
              [attr.d]="routed.path"
              [class.highlighted]="routed.highlighted"
              [class.subclass]="routed.edge.kind === 'subclass'" />
          }
        </svg>
        @for (placed of layout.nodes; track placed.node.id) {
          @let node = placed.node;
          @let selected = node.id === selectedIri();
          @let linksTo = linkedNames(node, 'to');
          @let linkedFrom = linkedNames(node, 'from');
          <button
            type="button"
            class="card"
            data-cy="data-model-map-card"
            [attr.data-id]="node.id"
            [class.selected]="selected"
            [class.neighbour]="neighbours().has(node.id)"
            [class.unlinked]="unlinked().has(node.id)"
            [class.external]="node.kind !== 'class'"
            [class.main]="node.id === main()?.id"
            [attr.data-tint]="tints().get(node.id) ?? 0"
            [style.left.px]="placed.x"
            [style.top.px]="placed.y"
            [style.width.px]="placed.width"
            [style.height.px]="placed.height"
            [attr.tabindex]="node.id === tabStop() ? 0 : -1"
            [attr.aria-current]="selected ? 'page' : null"
            [attr.aria-disabled]="node.navigable ? null : true"
            [attr.aria-label]="
              (t + '.card' | translate: { label: labelOf(node), count: node.count ?? 0 }) +
              (linksTo ? '; ' + (t + '.linksTo' | translate: { names: linksTo }) : '') +
              (linkedFrom ? '; ' + (t + '.linkedFrom' | translate: { names: linkedFrom }) : '') +
              (node.id === main()?.id ? '; ' + (t + '.mainClass' | translate) : '')
            "
            (focus)="focusedId.set(node.id)"
            (click)="select(node)">
            <span class="label">{{ labelOf(node) }}</span>
            @if (!condensed()) {
              <span class="meta">
                @if (node.kind === 'class') {
                  {{ node.count | number }}
                  @if (selected) {
                    · {{ t + '.youAreHere' | translate }}
                  } @else if (unlinked().has(node.id)) {
                    · {{ t + '.notLinked' | translate }}
                  }
                } @else if (node.kind === 'external') {
                  {{ t + '.external' | translate }}
                }
              </span>
              @if (node.kind === 'class') {
                <span class="bar" [style.width.%]="share(node)"></span>
              }
            }
          </button>
        }
      </nav>
      @if (hasTint()) {
        <div class="legend" aria-hidden="true">
          <span>{{ t + '.fewerLinks' | translate }}</span>
          <span class="swatches">
            @for (tint of [0, 1, 2, 3]; track tint) {
              <span class="swatch" [attr.data-tint]="tint"></span>
            }
          </span>
          <span>{{ t + '.moreLinks' | translate }}</span>
        </div>
      }
    }
  `,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
        padding: 0 8px 8px 16px;
      }

      :host(.full) {
        padding: 0;

        .card {
          font-size: 13px;
          line-height: 16px;
        }

        .meta {
          font-size: 11px;
        }
      }

      .header {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 32px;
        font-size: 12px;
        color: $cool_gray_500;
      }

      .class-count {
        flex: 1;
        min-width: 0;
      }

      .toggle {
        --mat-icon-button-state-layer-size: 28px;
        padding: 2px;
      }

      .full-map {
        --mat-button-text-container-height: 28px;
        --mat-button-text-label-text-size: 12px;
        --mat-button-text-horizontal-padding: 6px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .main-class {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        margin-bottom: 8px;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
        text-align: left;
        font: 400 12px/16px var(--font-sans, Roboto, sans-serif);
        color: $primary_800;

        mat-icon {
          flex: none;
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: $primary;
        }

        strong {
          font-weight: 600;
        }

        &:hover span {
          text-decoration: underline;
        }

        &:focus-visible {
          outline: 2px solid $primary;
          outline-offset: 2px;
        }
      }

      .legend {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        font-size: 11px;
        color: $cool_gray_500;
      }

      .swatches {
        display: flex;
        gap: 2px;
      }

      .swatch {
        width: 14px;
        height: 10px;
        border-radius: 2px;
        box-sizing: border-box;
      }

      .swatch[data-tint='0'] {
        background: white;
        border: 1px solid $cool_gray_300;
      }

      .card[data-tint='1'],
      .swatch[data-tint='1'] {
        background: $primary_50;
      }

      .card[data-tint='2'],
      .swatch[data-tint='2'] {
        background: $primary_100;
      }

      .card[data-tint='3'],
      .swatch[data-tint='3'] {
        background: $primary_300;
      }

      .map {
        position: relative;
        background: $cool_gray_50;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
      }

      .edges {
        position: absolute;
        inset: 0;
        overflow: visible;
        fill: none;
        stroke: $cool_gray_300;
        stroke-width: 1.5;
        stroke-linecap: round;

        .subclass {
          stroke-dasharray: 2 3;
        }

        .highlighted {
          stroke: $primary;
          stroke-width: 2;
        }
      }

      .card {
        position: absolute;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 5px 7px;
        overflow: hidden;
        border: 1px solid $cool_gray_300;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        text-align: left;
        font: 500 11px/13px var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_800;

        &:hover {
          border-color: $primary_400;
        }

        &:focus-visible {
          outline: 2px solid $primary;
          outline-offset: 1px;
        }

        &.neighbour {
          border-color: $primary_400;

          .bar {
            background: $primary_400;
          }
        }

        &.main {
          border: 2px solid $primary;
          box-shadow: 0 0 0 3px $primary_100;
        }

        // The fill stays the link tint; only the border says "you are here".
        &.selected {
          border: 3px solid $primary;
          padding: 3px 5px;

          .bar {
            background: $primary;
          }
        }

        &.unlinked {
          border-style: dashed;
          opacity: 0.6;
        }

        &.external {
          border-style: dashed;
          background: transparent;
          font-style: italic;
          color: $cool_gray_500;
        }

        &[aria-disabled='true'] {
          cursor: default;
        }
      }

      .condensed .card {
        justify-content: center;
        padding: 0 6px;
      }

      .label,
      .meta {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .meta {
        font-size: 10px;
        font-weight: 400;
        color: $cool_gray_500;
        font-variant-numeric: tabular-nums;
      }

      .bar {
        position: absolute;
        left: 0;
        bottom: 0;
        min-width: 2px;
        height: 3px;
        background: $cool_gray_300;
      }
    `,
  ],
})
export class DataModelMapComponent {
  /** The data model to draw. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class being browsed, if any. */
  readonly selectedIri = input<string | undefined>(undefined);
  /** Label for knora-api's "any resource" card, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Drawn large in the Ontology map tab: no header, every model drawn, full cards, wider rows. */
  readonly full = input(false);

  /** A class card was activated; emits the class IRI. */
  readonly classSelected = output<string>();
  /** "Full map" was clicked. */
  readonly openFullMap = output<void>();

  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _width = signal(0);

  private readonly _collapsed = signal(readStored(COLLAPSED_KEY) === 'true');
  readonly collapsed = computed(() => !this.full() && this._collapsed());
  readonly focusedId = signal<string | undefined>(undefined);

  readonly classCount = computed(() => this.graph().nodes.filter(node => node.kind === 'class').length);
  readonly condensed = computed(() => !this.full() && this.graph().nodes.length > CONDENSED_ABOVE);
  /** The host's content width less the map's border. */
  private readonly _mapWidth = computed(() => this._width() - 2);
  readonly fits = computed(() =>
    this.full() ? this._mapWidth() > 0 : this.graph().nodes.length <= HIDDEN_ABOVE && this._mapWidth() >= MIN_WIDTH
  );

  readonly layout = computed<DataModelLayout | undefined>(() => {
    if (!this.fits()) return undefined;
    const width = this._mapWidth();
    const perRow = this.full()
      ? Math.min(8, Math.max(3, Math.floor((width + 16) / (FULL_CARD_WIDTH + 16))))
      : undefined;
    return layoutDataModel(this.graph(), { width, condensed: this.condensed(), perRow });
  });
  readonly visibleLayout = computed(() => (this.collapsed() ? undefined : this.layout()));

  readonly neighbours = computed(() => {
    const selected = this.selectedIri();
    const ids = new Set<string>();
    for (const { source, target } of this.graph().edges) {
      if (source === selected) ids.add(target);
      if (target === selected) ids.add(source);
    }
    ids.delete(selected ?? '');
    return ids;
  });

  readonly unlinked = computed(() => {
    const linked = new Set(this.graph().edges.flatMap(edge => [edge.source, edge.target]));
    return new Set(
      this.graph()
        .nodes.filter(node => !linked.has(node.id))
        .map(node => node.id)
    );
  });

  /** Grey edges first, so the highlighted ones are drawn over them. */
  readonly orderedEdges = computed(() => {
    const selected = this.selectedIri();
    return (this.layout()?.edges ?? [])
      .map(routed => ({ ...routed, highlighted: routed.edge.source === selected || routed.edge.target === selected }))
      .sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
  });

  /** The one card in the tab order: the last one focused, else the class being browsed, else the first. */
  readonly tabStop = computed(() => {
    const nodes = this.layout()?.nodes ?? [];
    const has = (id: string | undefined) => id !== undefined && nodes.some(p => p.node.id === id);
    const focused = this.focusedId();
    const selected = this.selectedIri();
    return has(focused) ? focused : has(selected) ? selected : nodes[0]?.node.id;
  });

  private readonly _linkCounts = computed(() => linkCounts(this.graph()));
  /** How strongly each class card is tinted by the number of classes it is linked with. */
  readonly tints = computed(() => linkTints(this._linkCounts()));
  readonly hasTint = computed(() => [...this.tints().values()].some(tint => tint > 0));
  /** The class the data model is built around, when one clearly is. */
  readonly main = computed(() => mainClass(this._linkCounts()));

  private readonly _maxCount = computed(() => Math.max(1, ...this.graph().nodes.map(node => node.count ?? 0)));

  constructor() {
    const host = this._host.nativeElement;
    const measure = () => {
      const style = getComputedStyle(host);
      this._width.set(host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    };
    // ResizeObserver does not report while the page is in a background tab; read the first width directly.
    afterNextRender(measure);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  labelOf(node: DataModelNode): string {
    return node.kind === 'generic' && node.id === Constants.Resource ? this.anyResourceLabel() : node.label;
  }

  nodeById(id: string): DataModelNode {
    return this.graph().nodes.find(node => node.id === id)!;
  }

  share(node: DataModelNode): number {
    return ((node.count ?? 0) / this._maxCount()) * 100;
  }

  /** The names of the classes `node` links to, or is linked from, for its screen-reader label. */
  linkedNames(node: DataModelNode, direction: 'to' | 'from'): string {
    const ids = this.graph()
      .edges.filter(edge => edge.source !== edge.target)
      .filter(edge => (direction === 'to' ? edge.source : edge.target) === node.id)
      .map(edge => (direction === 'to' ? edge.target : edge.source));
    const nodes = this.graph().nodes.filter(n => ids.includes(n.id));
    return nodes.map(n => this.labelOf(n)).join(', ');
  }

  select(node: DataModelNode): void {
    if (node.navigable) {
      this.classSelected.emit(node.id);
    }
  }

  toggleCollapsed(): void {
    this._collapsed.update(collapsed => !collapsed);
    store(COLLAPSED_KEY, String(this._collapsed()));
  }

  /** Arrow keys move focus to the nearest card in that direction. */
  onKeydown(event: KeyboardEvent): void {
    const nodes = this.layout()?.nodes;
    const current = nodes?.find(p => p.node.id === this.tabStop());
    if (!nodes || !current || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const next = nearest(current, nodes, event.key as Direction);
    if (next) {
      this.focusedId.set(next.node.id);
      this._host.nativeElement.querySelector<HTMLElement>(`[data-id="${CSS.escape(next.node.id)}"]`)?.focus();
    }
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts until the page reloads.
  }
}

function nearest(from: PlacedNode, nodes: PlacedNode[], direction: Direction): PlacedNode | undefined {
  const centre = (p: PlacedNode) => [p.x + p.width / 2, p.y + p.height / 2];
  const [fx, fy] = centre(from);
  const candidates = nodes
    .filter(p => p !== from)
    .map(p => {
      const [x, y] = centre(p);
      const [along, across] =
        direction === 'ArrowUp' || direction === 'ArrowDown' ? [y - fy, x - fx] : [x - fx, y - fy];
      const forward = direction === 'ArrowDown' || direction === 'ArrowRight' ? along : -along;
      return { p, forward, distance: forward + Math.abs(across) * 2 };
    })
    .filter(c => c.forward > 0)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.p;
}
