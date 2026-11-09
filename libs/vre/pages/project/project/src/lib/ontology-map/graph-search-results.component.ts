import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { HighlightPipe } from '../data-models-rail/highlight.pipe';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { localNameOf } from './ontology-graph-elements';

/** A class the search found, with how many subclasses it has. */
export interface ClassResult {
  kind: 'class';
  iri: string;
  label: string;
  subclasses: number;
}

/** A link property the search found, with the first classes it links and how many other pairs it links. */
export interface PropertyResult {
  kind: 'property';
  iri: string;
  label: string;
  source: string;
  target: string;
  others: number;
}

export type SearchResult = ClassResult | PropertyResult;

/** What the search found, each property once. */
export interface SearchResults {
  classes: ClassResult[];
  properties: PropertyResult[];
}

/** The first row, which shows every result at once in the graph, as the search does. */
const ALL = { kind: 'all' } as const;
type Row = SearchResult | typeof ALL;

/**
 * The classes and link properties of the graph whose label or name has the text, case aside, by label; each property
 * once. Subclasses are counted in `model`, which keeps its subclass edges.
 */
export function graphSearchResults(graph: DataModelGraph, model: DataModelGraph, text: string): SearchResults {
  const query = text.trim().toLowerCase();
  if (!query) return { classes: [], properties: [] };
  const holds = (label: string, iri: string) =>
    label.toLowerCase().includes(query) || localNameOf(iri).toLowerCase().includes(query);
  const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);

  const classes = graph.nodes
    .filter(node => node.kind === 'class' && holds(node.label, node.id))
    .map(node => ({
      kind: 'class' as const,
      iri: node.id,
      label: node.label,
      subclasses: model.edges.filter(edge => edge.kind === 'subclass' && edge.target === node.id).length,
    }))
    .sort(byLabel);

  const properties = new Map<string, PropertyResult>();
  for (const edge of graph.edges) {
    if (edge.kind !== 'link' || !holds(edge.label, edge.property)) continue;
    const found = properties.get(edge.property);
    if (found) found.others++;
    else
      properties.set(edge.property, {
        kind: 'property',
        iri: edge.property,
        label: edge.label,
        source: edge.source,
        target: edge.target,
        others: 0,
      });
  }
  return { classes, properties: [...properties.values()].sort(byLabel) };
}

/**
 * The panel of what the graph's search found, where a class panel opens: the classes and properties, by kind. A row
 * opens its own panel in its place, as Enter does on the active row; its Filter button, or Shift+Enter, filters the graph
 * on it.
 */
@Component({
  selector: 'app-graph-search-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.floating]': 'floating()' },
  imports: [HighlightPipe, MatIcon, MatIconButton, MatTooltip, NgTemplateOutlet, TranslatePipe],
  template: `
    @let s = 'pages.ontologyMap.search';
    <section class="results" data-cy="ontology-map-search-results" [attr.aria-label]="s + '.results' | translate">
      <header class="header">
        <h2>{{ s + '.results' | translate }}</h2>
        <!-- For comparing where the results show; see the page's \`resultsPlacement\`. -->
        <button
          mat-icon-button
          data-cy="ontology-map-search-results-placement"
          [attr.aria-label]="s + (floating() ? '.inPanel' : '.underSearch') | translate"
          [matTooltip]="s + (floating() ? '.inPanel' : '.underSearch') | translate"
          (click)="placementToggled.emit()">
          <mat-icon>{{ floating() ? 'view_sidebar' : 'vertical_align_top' }}</mat-icon>
        </button>
        <button
          mat-icon-button
          data-cy="ontology-map-search-results-close"
          [attr.aria-label]="s + '.clear' | translate"
          [matTooltip]="s + '.clear' | translate"
          (click)="closed.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <div
        class="list"
        role="listbox"
        [attr.aria-label]="s + '.results' | translate"
        (mouseleave)="browsing.set(false)">
        @if (!count()) {
          <p class="none" role="status" data-cy="ontology-map-search-results-none">
            {{ s + '.noMatch' | translate: { text: text().trim() } }}
          </p>
        }
        <div
          class="row all"
          [hidden]="!count()"
          role="option"
          data-cy="ontology-map-search-all"
          [attr.aria-selected]="active() === 0"
          [class.active]="active() === 0"
          (mouseenter)="browse(0)">
          <mat-icon class="kind">search</mat-icon>
          <span class="label">{{ s + '.all' | translate }}</span>
          <span class="count">{{ count() }}</span>
        </div>
        @if (results().classes.length) {
          <span class="heading">{{ s + '.classes' | translate: { count: results().classes.length } }}</span>
          @for (result of results().classes; track result.iri) {
            <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: result }" />
          }
        }
        @if (results().properties.length) {
          <span class="heading">{{ s + '.properties' | translate: { count: results().properties.length } }}</span>
          @for (result of results().properties; track result.iri) {
            <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: result }" />
          }
        }
      </div>
      <span class="hint">{{ s + '.hint' | translate }}</span>
    </section>

    <ng-template #row let-result>
      @let index = rows().indexOf(result);
      <div
        class="row"
        role="option"
        data-cy="ontology-map-search-result"
        [attr.aria-selected]="index === active()"
        [class.active]="index === active()"
        (mouseenter)="browse(index)"
        (click)="opened.emit(result)">
        @if (result.kind === 'class') {
          <span class="swatch" [style.background]="colors().get(result.iri) ?? '#F3F4F6'"></span>
        } @else {
          <mat-icon class="kind">arrow_right_alt</mat-icon>
        }
        <span class="label">
          @for (part of result.label | highlight: [text()]; track $index) {
            @if (part.match) {
              <mark>{{ part.text }}</mark>
            } @else {
              <span>{{ part.text }}</span>
            }
          }
        </span>
        <span class="meta">
          @if (result.kind === 'class') {
            @if (result.subclasses) {
              {{ s + '.subclasses' | translate: { count: result.subclasses } }}
            }
          } @else {
            {{ labelOf()(result.source) }} → {{ labelOf()(result.target) }}
            @if (result.others) {
              +{{ result.others }}
            }
          }
        </span>
        <button
          type="button"
          class="filter"
          data-cy="ontology-map-search-filter"
          [attr.aria-label]="s + '.filterOn' | translate: { name: result.label }"
          (click)="$event.stopPropagation(); filtered.emit(result)">
          <mat-icon>filter_alt</mat-icon>
          {{ s + '.filter' | translate }}
        </button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      // Under the search instead: a card the graph shows through, faintly, which lightens with the pointer away.
      :host(.floating) {
        .results {
          width: 440px;
          max-height: 460px;
          padding: 8px 8px 6px;
          border: 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(2px);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
          opacity: 0.9;
          transition: opacity 120ms;

          &:hover {
            opacity: 1;
          }
        }

        .header {
          padding: 0 0 2px 10px;

          h2 {
            font-size: 13px;
            font-weight: 600;
            line-height: 20px;
          }
        }
      }

      // As the class and property panels, in their place.
      .results {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 20px 16px 12px;
        background: white;
        border-left: 1px solid #ebebeb;
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08);
        font: 400 13px/20px var(--font-sans, Roboto, sans-serif);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 0 8px 8px;

        h2 {
          flex: 1;
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          line-height: 28px;
        }
      }

      .list {
        flex: 1;
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .heading {
        padding: 6px 10px 4px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        padding: 0 6px 0 10px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;

        &.active {
          background: #eaeff3;

          .filter {
            visibility: visible;
          }
        }
      }

      .swatch {
        flex: none;
        width: 12px;
        height: 12px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 3px;
      }

      .kind {
        flex: none;
        width: 16px;
        height: 16px;
        font-size: 16px;
        color: $cool_gray_500;
      }

      .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      mark {
        background: none;
        font-weight: 700;
        color: $primary;
      }

      .meta {
        flex: none;
        max-width: 170px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11.5px;
        color: $cool_gray_500;
      }

      .filter {
        flex: none;
        visibility: hidden;
        display: flex;
        align-items: center;
        gap: 4px;
        height: 26px;
        padding: 0 8px;
        border: 1px solid $cool_gray_300;
        border-radius: 13px;
        background: white;
        font: inherit;
        font-size: 12px;
        color: $primary;
        cursor: pointer;

        mat-icon {
          width: 14px;
          height: 14px;
          font-size: 14px;
        }

        &:hover {
          border-color: $primary;
        }
      }

      .none {
        margin: 8px 10px;
        color: $cool_gray_500;
      }

      .all {
        margin-bottom: 4px;
        font-weight: 500;
      }

      .count {
        flex: none;
        min-width: 20px;
        padding: 0 6px;
        border-radius: 10px;
        background: $cool_gray_100;
        font-size: 12px;
        line-height: 20px;
        text-align: center;
        color: $cool_gray_700;
      }

      .hint {
        margin-top: 4px;
        padding: 6px 10px 2px;
        border-top: 1px solid $cool_gray_100;
        font-size: 11.5px;
        color: $cool_gray_500;
      }
    `,
  ],
})
export class GraphSearchResultsComponent {
  /** What the search found; see `graphSearchResults`. */
  readonly results = input.required<SearchResults>();
  readonly text = input.required<string>();
  readonly colors = input<ReadonlyMap<string, string>>(new Map());
  readonly labelOf = input.required<(iri: string) => string>();

  /** A row clicked: open its panel. */
  readonly opened = output<SearchResult>();
  /** A row's Filter: filter the graph on it. */
  readonly filtered = output<SearchResult>();
  /** The panel's close: clear the search. */
  readonly closed = output<void>();
  /** Whether the results float under the search, rather than fill the side panel. */
  readonly floating = input(false);
  /** Asks to show the results in the other place. */
  readonly placementToggled = output<void>();

  readonly count = computed(() => this.results().classes.length + this.results().properties.length);
  /** Every row in the order shown, "All results" first, for the arrow keys. */
  readonly rows = computed<Row[]>(() => [ALL, ...this.results().classes, ...this.results().properties]);
  /** The row the arrow keys and Enter act on; "All results" again once the results change. */
  readonly active = linkedSignal<Row[], number>({ source: this.rows, computation: () => 0 });

  /** Whether the rows are being gone through, with the pointer or the arrow keys; not once the results change. */
  readonly browsing = linkedSignal<Row[], boolean>({ source: this.rows, computation: () => false });
  /** The row gone through, for the graph to pick out; none until a row is reached. */
  readonly browsedChange = output<SearchResult | undefined>();

  constructor() {
    effect(() => {
      const row = this.browsing() ? this.rows()[this.active()] : undefined;
      this.browsedChange.emit(row && row.kind !== 'all' ? row : undefined);
    });
  }

  /** The pointer reached a row. */
  browse(index: number): void {
    this.active.set(index);
    this.browsing.set(true);
  }

  /** Moves the active row up or down, staying within the rows. */
  move(step: number): void {
    const count = this.rows().length;
    this.active.update(index => (index + step + count) % count);
    this.browsing.set(true);
  }

  /** Opens the active row's panel, as a click on it does; see `opened`. */
  openActive(): void {
    const row = this.rows()[this.active()];
    if (row && row.kind !== 'all') this.opened.emit(row);
  }

  /** Filters on the active row; see `filtered`. */
  filterActive(): void {
    const row = this.rows()[this.active()];
    if (row && row.kind !== 'all') this.filtered.emit(row);
  }
}
