import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import {
  PagedResponseRestrictedPropertyResource,
  RestrictedProperty,
  RestrictionCounts,
  ValueItemType,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { take } from 'rxjs';
import { CountCellComponent } from './count-cell.component';
import {
  PropertyValuesState,
  ViewRestrictionsByPropertyPageService,
} from './view-restrictions-by-property-page.service';

/** An expanded property row's drill-down. `loading` is a flag, not a state — see the class table. */
interface ExpandedProperty {
  page: PagedResponseRestrictedPropertyResource;
  currentPage: number;
  loading?: boolean;
}

/**
 * The property-grouped restrictions table.
 *
 * A sibling of the class table rather than a mode of it: the two mount independently and never share
 * state, so switching grouping cannot leave one showing the other's numbers.
 *
 * Two things read differently from the class table, both following from what a property is:
 *
 *   - The denominator column is `totalValues` — how many values of the property the project holds. It is a
 *     true share: the counts beside it are in the same unit, so "94 of 66,484 hidden" is sound. There is no
 *     second unit here at all, unlike the class table where resources and values must be kept apart.
 *   - Every drill-down row shows its **own** resource class. A property spans classes, which is the whole
 *     reason this view exists, so the class belongs to the row rather than the header.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-view-restrictions-by-property-table',
  templateUrl: './view-restrictions-by-property-table.component.html',
  styleUrl: './view-restrictions.component.scss',
  imports: [AsyncPipe, TranslatePipe, MatIcon, AppProgressIndicatorComponent, PagerComponent, CountCellComponent],
})
export class ViewRestrictionsByPropertyTableComponent {
  readonly ValueItemType = ValueItemType;

  readonly propertiesState$ = this.vr.propertiesState$;
  readonly valuesState$ = this.vr.valuesState$;
  readonly progress$ = this.vr.progress$;
  readonly anyFailed$ = this.vr.anyFailed$;
  readonly itemType$ = this.vr.itemType$;

  /** Stable empty map so the template's `??` fallback does not allocate on every change detection. */
  readonly emptyValues = new Map<string, PropertyValuesState>();

  readonly expanded = signal<Record<string, ExpandedProperty | 'loading' | 'failed'>>({});

  readonly pageSize = 25;

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    public vr: ViewRestrictionsByPropertyPageService,
    private readonly _resourceService: ResourceService
  ) {}

  resourceLink(resourceIri: string): string {
    return `/resource${this._resourceService.getResourcePath(resourceIri)}`;
  }

  /** Deep-links to the specific value, as the class table does. */
  valueLink(resourceIri: string, valueIri: string | undefined): string {
    const base = this.resourceLink(resourceIri);
    const valueUuid = valueIri?.split('/').filter(Boolean).pop();
    return valueUuid ? `${base}?highlightValue=${encodeURIComponent(valueUuid)}` : base;
  }

  /** Re-run step 2 for one property. The row's own button, so it must not also toggle the drill-down. */
  onRetryProperty(propertyIri: string, event: Event): void {
    event.stopPropagation();
    this.vr.retryProperty(propertyIri);
  }

  /**
   * A row opens only if something is restricted on it — or while its counts are still loading, since
   * judging it inert on incomplete data would make rows stop being clickable as numbers arrive.
   */
  isExpandable(state: PropertyValuesState | undefined): boolean {
    const c = state?.counts?.counts;
    const any = !!c && (!this.isEmpty(c.anonymous) || !this.isEmpty(c.authenticated) || !this.isEmpty(c.projectMember));
    return any || !!state?.loading;
  }

  isEmpty(counts: RestrictionCounts | undefined): boolean {
    return !counts?.hidden && !counts?.restrictedView;
  }

  /**
   * The project's whole value population across the listed properties.
   *
   * Summed client-side, like the class table's footer: the API answers one property per request, so no
   * single response could carry it.
   */
  totalValues(values: Map<string, PropertyValuesState>): number {
    return [...values.values()].reduce((sum, v) => sum + (v.counts?.totalValues ?? 0), 0);
  }

  /** Footer total for one audience, a lower bound whenever a property failed (the banner says so). */
  totalCounts(
    values: Map<string, PropertyValuesState>,
    audience: 'anonymous' | 'authenticated' | 'projectMember'
  ): RestrictionCounts {
    return [...values.values()].reduce(
      (acc, v) => {
        const c = v.counts?.counts?.[audience];
        return c ? { hidden: acc.hidden + c.hidden, restrictedView: acc.restrictedView + c.restrictedView } : acc;
      },
      { hidden: 0, restrictedView: 0 }
    );
  }

  /** Only claim "nothing restricted" once every property has answered. */
  hasNoRestrictions(properties: RestrictedProperty[], values: Map<string, PropertyValuesState>): boolean {
    const allAnswered = [...values.values()].every(v => !v.loading);
    const none = [...values.values()].every(v => {
      const c = v.counts?.counts;
      return !c || (this.isEmpty(c.anonymous) && this.isEmpty(c.authenticated) && this.isEmpty(c.projectMember));
    });
    return properties.length > 0 && allAnswered && none;
  }

  toggleProperty(propertyIri: string, state: PropertyValuesState | undefined): void {
    if (!this.isExpandable(state)) {
      return;
    }
    if (this.expanded()[propertyIri]) {
      const next = { ...this.expanded() };
      delete next[propertyIri];
      this.expanded.set(next);
      return;
    }
    this.loadPage(propertyIri, 1);
  }

  /**
   * Keeps the current page — and so the pager — mounted while the next one loads.
   *
   * `app-pager` holds its page index privately with no input to restore it, so unmounting it resets the
   * view to page 1 while the data is page 2. The class table hit exactly this.
   */
  loadPage(propertyIri: string, page: number): void {
    const current = this.expandedProperty(propertyIri);
    this.expanded.update(e => ({
      ...e,
      [propertyIri]: current ? { ...current, loading: true } : 'loading',
    }));
    this.vr
      .loadPropertyItems(propertyIri, page, this.pageSize)
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: result => {
          this.expanded.update(e => ({ ...e, [propertyIri]: { page: result, currentPage: page } }));
        },
        // Without this the row would spin forever.
        error: () => {
          this.expanded.update(e => ({ ...e, [propertyIri]: 'failed' }));
        },
      });
  }

  /**
   * `app-pager` emits on every index assignment, including its own reset, so ignore an event naming the
   * page already displayed — otherwise expanding a row immediately refetches page 1.
   */
  onPageIndexChanged(propertyIri: string, pageIndex: number): void {
    const page = pageIndex + 1;
    if (this.expandedProperty(propertyIri)?.currentPage === page) {
      return;
    }
    this.loadPage(propertyIri, page);
  }

  isExpanded(id: string): boolean {
    return !!this.expanded()[id];
  }

  isLoading(id: string): boolean {
    return this.expanded()[id] === 'loading';
  }

  isFailed(id: string): boolean {
    return this.expanded()[id] === 'failed';
  }

  isPageLoading(id: string): boolean {
    return !!this.expandedProperty(id)?.loading;
  }

  expandedProperty(id: string): ExpandedProperty | null {
    const e = this.expanded()[id];
    return e && e !== 'loading' && e !== 'failed' ? e : null;
  }

  /** Icon for a drill-down value, from the flags the API returns. */
  valueIcon(isFile: boolean, hasComment: boolean): string {
    return isFile ? 'image' : hasComment ? 'comment' : 'lock';
  }
}
