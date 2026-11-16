import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { HighlightPipe } from '../data-models-rail/highlight.pipe';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { localNameOf } from './ontology-graph-elements';

/**
 * A class the search found: how many subclasses it has, and how deep it sits under its parents when every class is
 * listed as a tree; 0 in a search, which lists them by label.
 */
export interface ClassResult {
  kind: 'class';
  iri: string;
  label: string;
  /** The end of its IRI. */
  name: string;
  /** Whether the search found it by its name only, not its label: the name then shows beside the label. */
  nameMatch: boolean;
  subclasses: number;
  depth: number;
}

/** A link property the search found, with how many classes of the data model use it. */
export interface PropertyResult {
  kind: 'property';
  iri: string;
  label: string;
  /** The end of its IRI. */
  name: string;
  /** Whether the search found it by its name only, not its label: the name then shows beside the label. */
  nameMatch: boolean;
  classes: number;
}

export type SearchResult = ClassResult | PropertyResult;

/** What the search found, each property once. */
export interface SearchResults {
  classes: ClassResult[];
  properties: PropertyResult[];
}

/** The row that shows every result at once in the graph, as the search does. */
const ALL = { kind: 'all' } as const;
/** The first row while the graph is filtered: it shows every class again. */
const RESET = { kind: 'reset' } as const;
type Action = typeof ALL | typeof RESET;
type Row = SearchResult | Action;

const isResult = (row: Row | undefined): row is SearchResult => row?.kind === 'class' || row?.kind === 'property';

/**
 * The classes and link properties of the graph whose label or name has the text, case aside; each property once.
 * Subclasses, and the classes using a property, are counted in `model`, the whole data model. With `all` and no text,
 * every class and property: the classes as a tree, each subclass under its parent; else by label.
 */
export function graphSearchResults(
  graph: DataModelGraph,
  model: DataModelGraph,
  text: string,
  all = false
): SearchResults {
  const query = text.trim().toLowerCase();
  if (!query && !all) return { classes: [], properties: [] };
  const inLabel = (label: string) => !query || label.toLowerCase().includes(query);
  const inName = (iri: string) => !!query && localNameOf(iri).toLowerCase().includes(query);
  const holds = (label: string, iri: string) => inLabel(label) || inName(iri);
  const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);

  const found = graph.nodes
    .filter(node => node.kind === 'class' && holds(node.label, node.id))
    .map((node): ClassResult => ({
      kind: 'class',
      iri: node.id,
      label: node.label,
      name: localNameOf(node.id),
      nameMatch: !inLabel(node.label),
      subclasses: model.edges.filter(edge => edge.kind === 'subclass' && edge.target === node.id).length,
      depth: 0,
    }))
    .sort(byLabel);
  const classes = query ? found : asTree(found, model);

  const users = new Map<string, Set<string>>();
  for (const edge of model.edges) {
    if (edge.kind === 'link') users.set(edge.property, (users.get(edge.property) ?? new Set()).add(edge.source));
  }
  const properties = new Map<string, PropertyResult>();
  for (const edge of graph.edges) {
    if (edge.kind !== 'link' || properties.has(edge.property) || !holds(edge.label, edge.property)) continue;
    properties.set(edge.property, {
      kind: 'property',
      iri: edge.property,
      label: edge.label,
      name: localNameOf(edge.property),
      nameMatch: !inLabel(edge.label),
      classes: users.get(edge.property)?.size ?? 0,
    });
  }
  return { classes, properties: [...properties.values()].sort(byLabel) };
}

/** The classes, by label, each followed by its subclasses among them, one level deeper. */
function asTree(classes: ClassResult[], model: DataModelGraph): ClassResult[] {
  const listed = new Set(classes.map(result => result.iri));
  const parentOf = new Map<string, string>();
  for (const edge of model.edges) {
    if (edge.kind === 'subclass' && listed.has(edge.source) && listed.has(edge.target) && !parentOf.has(edge.source))
      parentOf.set(edge.source, edge.target);
  }
  const tree: ClassResult[] = [];
  const seen = new Set<string>();
  const add = (result: ClassResult, depth: number) => {
    if (seen.has(result.iri)) return;
    seen.add(result.iri);
    tree.push({ ...result, depth });
    for (const sub of classes) if (parentOf.get(sub.iri) === result.iri) add(sub, depth + 1);
  };
  for (const result of classes) if (!parentOf.has(result.iri)) add(result, 0);
  // A loop of subclasses has no top; its classes still show, at the top level.
  for (const result of classes) add(result, 0);
  return tree;
}

/**
 * The card under the graph's search of what it found: the classes and properties, by kind. Going through the rows,
 * with the pointer or the arrow keys, shows each one's panel; a click on a row, or Enter, filters the graph on it.
 * While the graph is filtered, a first row shows every class again.
 */
@Component({
  selector: 'app-graph-search-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighlightPipe, MatIcon, NgTemplateOutlet, TranslatePipe],
  template: `
    @let s = 'pages.ontologyMap.search';
    <section class="results" data-cy="ontology-map-search-results" [attr.aria-label]="s + '.results' | translate">
      <div
        class="list"
        role="listbox"
        [attr.aria-label]="s + '.results' | translate"
        (mousedown)="$event.preventDefault()"
        (mouseleave)="browsing.set(false)">
        @if (narrowed()) {
          @let index = rows().indexOf(reset);
          <div
            class="row action reset"
            role="option"
            data-cy="ontology-map-search-reset"
            [attr.aria-selected]="active() === index"
            [class.active]="active() === index"
            (mousemove)="browse(index)"
            (click)="resetFilter.emit()">
            <mat-icon class="kind">filter_alt_off</mat-icon>
            <span class="label">{{ s + '.resetFilter' | translate }}</span>
            <ng-container [ngTemplateOutlet]="enter" [ngTemplateOutletContext]="{ $implicit: index }" />
          </div>
        }
        @if (!browseAll() && count()) {
          @let index = rows().indexOf(all);
          <div
            class="row action"
            role="option"
            data-cy="ontology-map-search-all"
            [attr.aria-selected]="active() === index"
            [class.active]="active() === index"
            (mousemove)="browse(index)">
            <mat-icon class="kind">search</mat-icon>
            <span class="label">{{ s + '.all' | translate }}</span>
            <span class="count">{{ count() }}</span>
          </div>
        }
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
    </section>

    <ng-template #row let-result>
      @let index = rows().indexOf(result);
      <div
        class="row"
        role="option"
        data-cy="ontology-map-search-result"
        [style.padding-left.px]="10 + (result.kind === 'class' ? result.depth : 0) * 16"
        [attr.aria-selected]="index === active()"
        [class.active]="index === active()"
        (mousemove)="browse(index)"
        (click)="filtered.emit(result)">
        @if (result.kind === 'class') {
          <span class="swatch" [style.background]="colors().get(result.iri) ?? '#F3F4F6'"></span>
        } @else {
          <mat-icon class="kind">arrow_right_alt</mat-icon>
        }
        <span class="label">
          <ng-container [ngTemplateOutlet]="marked" [ngTemplateOutletContext]="{ $implicit: result.label }" />
        </span>
        @if (result.nameMatch) {
          <span class="name" data-cy="ontology-map-search-name">
            <ng-container [ngTemplateOutlet]="marked" [ngTemplateOutletContext]="{ $implicit: result.name }" />
          </span>
        }
        @if (result.kind === 'class') {
          @if (result.subclasses) {
            <span class="meta">{{ s + '.subclasses' | translate: { count: result.subclasses } }}</span>
          }
        } @else if (result.classes) {
          <span class="meta">{{
            s + (result.classes === 1 ? '.usedByOne' : '.usedBy') | translate: { count: result.classes }
          }}</span>
        }
        <ng-container [ngTemplateOutlet]="enter" [ngTemplateOutletContext]="{ $implicit: index }" />
      </div>
    </ng-template>

    <ng-template #marked let-value>
      @for (part of value | highlight: [text()]; track $index) {
        @if (part.match) {
          <mark>{{ part.text }}</mark>
        } @else {
          <span>{{ part.text }}</span>
        }
      }
    </ng-template>

    <!-- What Enter does on the active row. -->
    <ng-template #enter let-index>
      <span class="enter" aria-hidden="true" [class.shown]="index === active()">↵</span>
    </ng-template>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      // A card under the search, see-through: the graph shows faintly behind it.
      .results {
        box-sizing: border-box;
        width: 340px;
        max-height: 320px;
        display: flex;
        flex-direction: column;
        padding: 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(2px);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
        font: 400 13px/20px var(--font-sans, Roboto, sans-serif);
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

      // The name a result was found by, beside its label.
      .name {
        flex: 0 1 auto;
        min-width: 0;
        max-width: 45%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--font-mono, 'Roboto Mono', monospace);
        font-size: 11px;
        color: $cool_gray_500;
      }

      .meta {
        flex: none;
        max-width: 110px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11.5px;
        color: $cool_gray_500;
      }

      .enter {
        flex: none;
        width: 14px;
        visibility: hidden;
        font-size: 13px;
        text-align: center;
        color: $cool_gray_500;

        &.shown {
          visibility: visible;
        }
      }

      .action {
        font-weight: 500;
      }

      // An action, not a result: set apart from the rows under it.
      .reset {
        margin-bottom: 4px;
        border-bottom: 1px solid $cool_gray_100;
        border-radius: 6px 6px 0 0;
        color: $primary;

        .kind {
          color: $primary;
        }
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
    `,
  ],
})
export class GraphSearchResultsComponent {
  /** What the search found; see `graphSearchResults`. */
  readonly results = input.required<SearchResults>();
  readonly text = input.required<string>();
  readonly colors = input<ReadonlyMap<string, string>>(new Map());
  /** Whether the list shows every class and property, nothing searched: no "All results" row, which would do nothing. */
  readonly browseAll = input(false);
  /** Whether the graph is filtered: a first row then shows every class again. */
  readonly narrowed = input(false);

  /** A row clicked, or Enter on it: filter the graph on it. */
  readonly filtered = output<SearchResult>();
  /** The first row clicked, or Enter on it, while the graph is filtered: show every class again. */
  readonly resetFilter = output<void>();

  protected readonly all = ALL;
  protected readonly reset = RESET;

  readonly count = computed(() => this.results().classes.length + this.results().properties.length);
  /** Every row in the order shown, for the arrow keys. */
  readonly rows = computed<Row[]>(() => [
    ...(this.narrowed() ? [RESET] : []),
    ...(!this.browseAll() && this.count() ? [ALL] : []),
    ...this.results().classes,
    ...this.results().properties,
  ]);
  /**
   * The row the arrow keys and Enter act on, once the results change: the first one after "Show all classes", so that
   * a quick Enter never clears a filter by chance; whatever panel shows.
   */
  readonly active = linkedSignal<Row[], number>({
    source: this.rows,
    computation: rows =>
      Math.max(
        0,
        rows.findIndex(row => row.kind !== 'reset')
      ),
  });

  /** Whether the rows are being gone through, with the pointer or the arrow keys; not once the results change. */
  readonly browsing = linkedSignal<Row[], boolean>({ source: this.rows, computation: () => false });
  /** The row gone through, for the graph to pick out; none until a row is reached. */
  readonly browsedChange = output<SearchResult | undefined>();
  /**
   * The row the arrow keys or the pointer reached, for its panel to show while the list stays open: a class or
   * property, or none for "All results". The row that shows every class again previews nothing.
   */
  readonly previewed = output<SearchResult | undefined>();

  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // The list opens scrolled to its active row, such as the one whose panel shows.
    afterNextRender(() => this._scrollToActive());
    effect(() => {
      const row = this.browsing() ? this.rows()[this.active()] : undefined;
      this.browsedChange.emit(isResult(row) ? row : undefined);
    });
  }

  /**
   * The pointer moved over a row: it becomes the active one, and previews its panel. Only a move of the pointer counts,
   * not the list scrolling under a still pointer as the arrow keys go down it.
   */
  browse(index: number): void {
    if (this.browsing() && this.active() === index) return;
    this.active.set(index);
    this.browsing.set(true);
    this._preview();
  }

  /** Moves the active row up or down, staying within the rows. */
  move(step: number): void {
    const count = this.rows().length;
    if (!count) return;
    this.active.update(index => (index + step + count) % count);
    this.browsing.set(true);
    setTimeout(() => this._scrollToActive());
    this._preview();
  }

  private _preview(): void {
    const row = this.rows()[this.active()];
    if (row?.kind === 'reset') return;
    this.previewed.emit(isResult(row) ? row : undefined);
  }

  private _scrollToActive(): void {
    this._host.nativeElement.querySelector('.row.active')?.scrollIntoView({ block: 'nearest' });
  }

  /** Acts on the active row, as a click on it does: filters on a result, or shows every class again. */
  filterActive(): void {
    const row = this.rows()[this.active()];
    if (row?.kind === 'reset') this.resetFilter.emit();
    else if (isResult(row)) this.filtered.emit(row);
  }
}
