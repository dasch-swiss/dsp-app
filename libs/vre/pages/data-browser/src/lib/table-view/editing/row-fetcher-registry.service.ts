import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable, OnDestroy } from '@angular/core';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/resource-editor';

/**
 * One {@link ResourceFetcherService} per table row, created the first time a cell of that row is
 * opened for editing.
 *
 * The resource editor's save path ends in `ResourceFetcherService.reload()`, and `reload()` throws
 * unless `loadResource()` has been called on that same instance — so a cell cannot host the editor
 * without one. It has to be per row, because it holds *a* resource, not any resource.
 *
 * It also has to be lazy. A page is 25 rows; seeding a fetcher per row on render would fire 25
 * single-resource requests behind the one batch fetch the table does precisely to avoid them
 * (REQ-4.14). So nothing is created until a cell is opened — and then it is kept, so opening a
 * second cell in the same row re-uses the resource already fetched instead of fetching it again.
 *
 * Provided by {@link DataTableComponent} rather than in root: the cache is only meaningful for the
 * rows currently on screen, and the table is what knows when those change.
 */
@Injectable()
export class TableRowFetcherRegistry implements OnDestroy {
  private readonly _parent = inject(EnvironmentInjector);

  /**
   * Keyed by resource IRI rather than by row index, so a re-render that moves a row does not hand
   * it another row's resource.
   *
   * The injector is kept alongside the service because destroying it is the only way to release
   * what it holds; dropping the reference alone would leave the service's subscriptions alive.
   */
  private readonly _byResourceIri = new Map<
    string,
    { injector: EnvironmentInjector; fetcher: ResourceFetcherService }
  >();

  /** The row's fetcher, seeded with its resource. Created on the first call for that resource. */
  fetcherFor(resourceIri: string): ResourceFetcherService {
    const existing = this._byResourceIri.get(resourceIri);
    if (existing) {
      return existing.fetcher;
    }

    // `createEnvironmentInjector` rather than `Injector.create`: it takes ordinary providers and so
    // uses the service's own `@Injectable()` factory. The static form would mean restating
    // `ResourceFetcherService`'s constructor parameters here, where a change to them would compile
    // cleanly and fail at runtime.
    const injector = createEnvironmentInjector([ResourceFetcherService], this._parent);
    const fetcher = injector.get(ResourceFetcherService);
    fetcher.loadResource(resourceIri);

    this._byResourceIri.set(resourceIri, { injector, fetcher });
    return fetcher;
  }

  /** Release every row's fetcher. Called when the table's rows are replaced. */
  clear(): void {
    this._byResourceIri.forEach(({ injector }) => injector.destroy());
    this._byResourceIri.clear();
  }

  ngOnDestroy(): void {
    this.clear();
  }
}
