import { inject, Injectable } from '@angular/core';
import { ListNodeV2WithAllLanguages, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { Observable, Subject } from 'rxjs';
import { DynamicFormsDataService } from './dynamic-forms-data.service';

/**
 * Per-list, in-memory index of node IRI → multi-language labels, populated lazily on first request.
 *
 * The chip pipe (and any other read-time consumer) needs the multi-language labels of a list node to
 * render it in the current UI language, but the URL only carries the node's IRI (DEV-6857 removed the
 * frozen `valueLabel` for list values from the URL). This class fetches the whole list tree once per
 * root IRI via {@link DynamicFormsDataService.getListWithAllLanguages$}, walks it into a flat
 * `Map<nodeIri, labels>`, and exposes:
 *   - a synchronous {@link getLabels} for `pure: false` pipes — returns undefined until the fetch resolves;
 *   - a hot {@link changes$} tick that fires once per successful load, so those pipes can re-check.
 *
 * The class is provided at the advanced-search route scope, so its cache is torn down when the user
 * leaves the page. `ListValueComponent` still fetches its own copy of the tree directly (kept for
 * the picker's language-switch subscription); consolidating those two fetches is tracked as a
 * follow-up — a chip's first render and a popover open on the same list can therefore fire two GETs.
 */
@Injectable()
export class ListNodeLabelResolver {
  private readonly _dataService = inject(DynamicFormsDataService);

  /** Root-list IRI → flat lookup of that list's nodes by node IRI. Populated on first {@link getLabels}. */
  private readonly _labelsByNodeIri = new Map<string, Map<string, StringLiteralV2[]>>();

  /** Root-list IRIs whose fetch is currently in flight, so concurrent lookups do not re-issue the GET. */
  private readonly _inFlight = new Set<string>();

  /**
   * Fires each time a list finishes loading (and populates the index). Impure consumers like
   * `ChipLabelPipe` subscribe once to trigger a re-render via `markForCheck` on emission; the emitted
   * value is intentionally void. A `Subject` (not `BehaviorSubject`) — this is a hot event bus with
   * no meaningful "initial value", and future subscribers should not receive a stale replay tick.
   */
  private readonly _changes$ = new Subject<void>();
  readonly changes$: Observable<void> = this._changes$.asObservable();

  /**
   * Synchronous lookup for a single node's labels. Returns undefined while the list is being fetched
   * (or when the node isn't in the tree); consumers must fall back to their own last-known label.
   * The first call for a given root IRI kicks off the fetch and completes asynchronously; subsequent
   * calls hit the cache.
   */
  getLabels(rootListNodeIri: string, nodeIri: string): StringLiteralV2[] | undefined {
    const index = this._labelsByNodeIri.get(rootListNodeIri);
    if (index) return index.get(nodeIri);
    this._ensureLoaded(rootListNodeIri);
    return undefined;
  }

  private _ensureLoaded(rootListNodeIri: string): void {
    if (this._inFlight.has(rootListNodeIri) || this._labelsByNodeIri.has(rootListNodeIri)) return;
    this._inFlight.add(rootListNodeIri);
    this._dataService.getListWithAllLanguages$(rootListNodeIri).subscribe({
      next: root => {
        // A "loaded but empty" root — either the fetch errored (upstream swallows to `of(undefined)`)
        // or the list is genuinely empty. Clear the in-flight flag so a later interaction can retry
        // instead of leaving the chip stuck on the IRI fallback forever.
        if (!root) {
          this._inFlight.delete(rootListNodeIri);
          return;
        }
        const index = new Map<string, StringLiteralV2[]>();
        this._indexNode(root, index);
        this._labelsByNodeIri.set(rootListNodeIri, index);
        this._inFlight.delete(rootListNodeIri);
        this._changes$.next();
      },
      // Defensive belt-and-braces: `DynamicFormsDataService.getListWithAllLanguages$` already
      // swallows HTTP errors into `of(undefined)`, so this branch should never fire — but if the
      // shape ever changes, we still want to unwind the in-flight flag rather than get stuck.
      error: () => {
        this._inFlight.delete(rootListNodeIri);
      },
    });
  }

  private _indexNode(node: ListNodeV2WithAllLanguages, into: Map<string, StringLiteralV2[]>): void {
    into.set(node.id, node.labels);
    for (const child of node.children) {
      this._indexNode(child, into);
    }
  }
}
