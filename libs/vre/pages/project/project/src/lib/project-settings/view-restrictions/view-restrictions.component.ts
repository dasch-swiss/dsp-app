import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import {
  ItemType,
  PagedResponseRestrictedResource,
  RestrictedClass,
  RestrictedItem,
  RestrictedResource,
  RestrictionCounts,
  ValueItemType,
  Visibility,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { take } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { CountCellComponent } from './count-cell.component';
import { ViewRestrictionsByPropertyPageService } from './view-restrictions-by-property-page.service';
import { ViewRestrictionsByPropertyTableComponent } from './view-restrictions-by-property-table.component';
import { ValuesState, ViewRestrictionsPageService } from './view-restrictions-page.service';
import { VisibilityCellComponent } from './visibility-cell.component';

/**
 * An expanded row's drill-down.
 *
 * `loading` is a flag on the state rather than a state of its own, so paging keeps the current page — and
 * with it the pager — mounted while the next page is fetched. Replacing the whole value with a spinner
 * unmounted `app-pager`, which holds its page index internally (no input for it), so it remounted at index
 * 0 and the view snapped back to page 1 while the data was page 2.
 */
interface ExpandedGroup {
  page: PagedResponseRestrictedResource;
  currentPage: number;
  loading?: boolean;
}

/**
 * Translation-key slugs for the API enums. Decoupled from the enum *values* on purpose: the
 * generated client currently emits PascalCase (`ItemType.All === 'All'`), and using those verbatim
 * as i18n keys would silently fall back to the raw key if the API ever changes its casing.
 */
const ITEM_TYPE_SLUG: Record<ValueItemType, string> = {
  All: 'all',
  File: 'file',
  Value: 'value',
  Comment: 'comment',
};

/**
 * Read-only "View restrictions" page (design screen 1i): a per-audience matrix of restricted items,
 * grouped by resource class or property, with an expandable drill-down of affected resources/items.
 *
 * Each audience cell splits its count along two axes, neither of them collapsed:
 *
 *   - **state** — *hidden* (permission code 0, nothing served) vs *restricted view* (code 1, a degraded
 *     version served). Disjoint, and shown side by side rather than summed.
 *   - **unit** — restricted whole *resources* vs restricted *values* inside resources. Also never
 *     summed: one resource with three hidden values is 1 resource and 3 values, not 4 of anything.
 *
 * In resource-class mode the matrix carries an extra "Resources" column: the class's whole population.
 * It is the denominator for the *resources* unit only — the values unit counts a different thing and is
 * not a share of it. A property has no resource population of its own, so the API omits
 * `totalResources` in property mode and the column disappears with it (see `showTotals`).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-view-restrictions',
  templateUrl: './view-restrictions.component.html',
  styleUrl: './view-restrictions.component.scss',
  // Both services are provided HERE, above the tables, so neither is destroyed when the toggle
  // unmounts its table. An Angular service provided on a component dies with it, which would clear the
  // per-row cache on every switch and make the "switch back is instant" requirement unsatisfiable.
  providers: [ViewRestrictionsPageService, ViewRestrictionsByPropertyPageService],
  imports: [
    AsyncPipe,
    TranslatePipe,
    MatIcon,
    MatChipsModule,
    AppProgressIndicatorComponent,
    PagerComponent,
    VisibilityCellComponent,
    CountCellComponent,
    MatButtonToggleModule,
    ViewRestrictionsByPropertyTableComponent,
  ],
})
export class ViewRestrictionsComponent {
  // expose enums to the template
  readonly ValueItemType = ValueItemType;

  /**
   * Which grouping the screen is showing. A screen-level toggle only — the two tables have separate API
   * routes and separate state, so this chooses which to mount rather than parameterising one report.
   */
  readonly grouping = signal<'class' | 'property'>('class');

  onGrouping(value: 'class' | 'property'): void {
    this.expanded.set({});
    this.grouping.set(value);
  }

  readonly itemTypeChips: ValueItemType[] = [
    ValueItemType.All,
    ValueItemType.File,
    ValueItemType.Value,
    ValueItemType.Comment,
  ];

  readonly classesState$ = this.vr.classesState$;
  readonly valuesState$ = this.vr.valuesState$;
  readonly progress$ = this.vr.progress$;
  readonly anyFailed$ = this.vr.anyFailed$;
  readonly itemType$ = this.vr.itemType$;

  /** Per-group expansion state, keyed by group id. A signal so OnPush re-renders when it changes. */
  readonly expanded = signal<Record<string, ExpandedGroup | 'loading' | 'failed'>>({});

  /** Drill-down page size; also fed to `app-pager` so it can compute the page count. */
  readonly pageSize = 25;

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    protected titleService: Title,
    public vr: ViewRestrictionsPageService,
    private readonly vrByProperty: ViewRestrictionsByPropertyPageService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _resourceService: ResourceService
  ) {
    // Subscribed here rather than exposed as a `project$` for the template to unwrap: the title is a
    // side effect with no rendered output, so a cold observable would simply never run.
    this._projectPageService.currentProject$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(project => {
      this.titleService.setTitle(`Project ${project.shortname} | View restrictions`);
    });
  }

  /** In-app path to open a resource: `/resource/{shortcode}/{uuid}` (getResourcePath strips the iriBase). */
  resourceLink(resourceIri: string): string {
    return `/resource${this._resourceService.getResourcePath(resourceIri)}`;
  }

  /**
   * Path to open a restricted item: the containing resource, deep-linked to the specific value via
   * `?highlightValue={valueUuid}` (the value UUID is the last segment of the value IRI). Falls back to
   * the resource link when there is no value IRI.
   */
  itemLink(resourceIri: string, valueIri: string | undefined): string {
    const base = this.resourceLink(resourceIri);
    const valueUuid = valueIri?.split('/').filter(Boolean).pop();
    return valueUuid ? `${base}?highlightValue=${encodeURIComponent(valueUuid)}` : base;
  }

  /**
   * The filter chips are shared by both groupings, so both services are updated.
   *
   * Keeping them in step matters because each caches per `(itemType, id)`: if only the visible one were
   * updated, switching grouping would show the other table still filtered by whatever it last saw, with
   * no indication that the chips and the numbers disagree.
   */
  onItemType(value: ValueItemType): void {
    this.expanded.set({});
    this.vr.setItemType(value);
    this.vrByProperty.setItemType(value);
  }

  /** Re-run step 2 for one class after a failure, leaving every other row's data in place. */
  onRetryClass(classIri: string, event: Event): void {
    // The row itself is a button that expands the drill-down, so the retry control inside it must not
    // also toggle expansion.
    event.stopPropagation();
    this.vr.retryClass(classIri);
  }

  /** Stable empty map, so the template's `?? ` fallback does not allocate on every change detection. */
  readonly emptyValues = new Map<string, ValuesState>();

  /**
   * Footer total for one audience's resource counts, summed over the classes on screen.
   *
   * Summed here rather than served by the API: the two steps answer in different units and step 2 arrives
   * per class, so there is no single response a server-side total could live in.
   */
  totalCounts(
    classes: RestrictedClass[],
    audience: 'anonymous' | 'authenticated' | 'projectMember'
  ): RestrictionCounts {
    return classes.reduce(
      (acc, c) => ({
        hidden: acc.hidden + c.counts[audience].hidden,
        restrictedView: acc.restrictedView + c.counts[audience].restrictedView,
      }),
      { hidden: 0, restrictedView: 0 }
    );
  }

  /**
   * Footer total for one audience's value counts.
   *
   * A lower bound whenever a class failed — classes without counts contribute nothing rather than being
   * guessed at. The banner above the table says so, which is why understating here is safe.
   */
  totalValueCounts(
    values: Map<string, ValuesState>,
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

  /**
   * The project's whole resource count — the footer's "Resources" cell.
   *
   * Summed over the reported classes rather than requested separately, so it always agrees with the rows
   * on screen. Every class is reported, including those with no restrictions, so this is the project's
   * total resource count and not merely the restricted subset. Never a lower bound: it comes wholly from
   * step 1, which either succeeded or left the page in its error state.
   */
  totalResources(classes: RestrictedClass[] | undefined): number {
    return (classes ?? []).reduce((sum, c) => sum + c.totalResources, 0);
  }

  /**
   * Whether an audience has nothing to report at all, in either unit.
   *
   * Deliberately wider than what a cell renders: the matrix shows the `resources` unit only, but a project
   * whose sole restrictions are on values inside otherwise-visible resources still has restrictions. Judging
   * that by `resources` alone would announce "no restrictions" over a report that has findings in it.
   *
   * Checks both states too — a cell with only restricted-view counts and nothing hidden is still a finding.
   */
  isEmptyCount(counts: RestrictionCounts | undefined): boolean {
    return !counts?.hidden && !counts?.restrictedView;
  }

  /**
   * Whether a row has anything to drill into, and so whether it opens at all.
   *
   * In class mode the API lists *every* class in the project, restricted or not, so most rows on a
   * healthy project have nothing beneath them. Those rows used to expand onto an empty list — the
   * chevron turned, no content appeared, and it read as a panel that opened and shut by itself. They
   * are inert instead: no chevron, no hover, not focusable (see the template).
   *
   * Judged from the counts rather than by fetching and seeing: the drill-down takes the same
   * `itemType` filter as the summary, so a row whose every audience is empty under the active filter
   * is exactly a row whose drill-down comes back empty. That also means the answer changes with the
   * filter — a class restricted only on whole resources goes inert under `Value` — which is correct,
   * since the drill-down would have nothing to show there either.
   */
  isExpandable(clazz: RestrictedClass, values: ValuesState | undefined): boolean {
    const r = clazz.counts;
    const v = values?.counts?.counts;
    const anyResource =
      !this.isEmptyCount(r.anonymous) || !this.isEmptyCount(r.authenticated) || !this.isEmptyCount(r.projectMember);
    const anyValue =
      !!v &&
      (!this.isEmptyCount(v.anonymous) || !this.isEmptyCount(v.authenticated) || !this.isEmptyCount(v.projectMember));
    // While step 2 is still in flight a row is left expandable: judging it inert on incomplete data would
    // make rows stop being clickable as their counts arrive, which reads as the UI fighting the user.
    return anyResource || anyValue || !!values?.loading;
  }

  /**
   * Whether the report found no restriction anywhere, even though rows are listed.
   *
   * In class mode the API reports every class in the project, so `groups` is non-empty whenever the
   * project has any resources at all — the `@empty` branch alone would then never fire and a project
   * with nothing restricted would silently render a table of dashes. This says so explicitly.
   */
  hasNoRestrictions(classes: RestrictedClass[], values: Map<string, ValuesState>): boolean {
    const noResources = classes.every(
      c =>
        this.isEmptyCount(c.counts.anonymous) &&
        this.isEmptyCount(c.counts.authenticated) &&
        this.isEmptyCount(c.counts.projectMember)
    );
    // Only claim "nothing restricted" once every class has actually answered. Saying it while step 2 is
    // still running would be a statement the data does not yet support.
    const allAnswered = [...values.values()].every(v => !v.loading);
    const noValues = [...values.values()].every(v => {
      const c = v.counts?.counts;
      return (
        !c ||
        (this.isEmptyCount(c.anonymous) && this.isEmptyCount(c.authenticated) && this.isEmptyCount(c.projectMember))
      );
    });
    return noResources && allAnswered && noValues;
  }

  toggleGroup(clazz: RestrictedClass, values: ValuesState | undefined): void {
    // The template already makes an empty row inert; this guards the path itself, so a row that
    // became empty under a new filter cannot be opened by a click that was already in flight.
    if (!this.isExpandable(clazz, values)) {
      return;
    }
    if (this.expanded()[clazz.id]) {
      const next = { ...this.expanded() };
      delete next[clazz.id];
      this.expanded.set(next);
      return;
    }
    this.loadPage(clazz.id, 1);
  }

  loadPage(groupId: string, page: number): void {
    // The first page has nothing to keep on screen, so it gets the page-level spinner. Subsequent pages
    // keep the current one rendered and only mark it loading, which is what stops the pager unmounting.
    const current = this.expandedGroup(groupId);
    this.expanded.update(e => ({
      ...e,
      [groupId]: current ? { ...current, loading: true } : 'loading',
    }));
    this.vr
      .loadItems(groupId, page, this.pageSize)
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: result => {
          this.expanded.update(e => ({ ...e, [groupId]: { page: result, currentPage: page } }));
        },
        // Without this the group would stay on 'loading' forever and spin indefinitely.
        error: () => {
          this.expanded.update(e => ({ ...e, [groupId]: 'failed' }));
        },
      });
  }

  /**
   * Bridge from `app-pager`'s 0-based `pageIndexChanged` to this API's 1-based paging.
   *
   * The pager emits on every index assignment — including the reset to 0 its own `ngOnChanges`
   * performs when `numberOfAllResults` changes — so ignore an event that names the page already
   * displayed, otherwise expanding a group would immediately refetch page 1.
   */
  onPageIndexChanged(groupId: string, pageIndex: number): void {
    const page = pageIndex + 1;
    if (this.expandedGroup(groupId)?.currentPage === page) {
      return;
    }
    this.loadPage(groupId, page);
  }

  isExpanded(id: string): boolean {
    return !!this.expanded()[id];
  }

  /** The first page is still loading, so there is nothing to show yet. See `isPageLoading` for paging. */
  isLoading(id: string): boolean {
    return this.expanded()[id] === 'loading';
  }

  isFailed(id: string): boolean {
    return this.expanded()[id] === 'failed';
  }

  expandedGroup(id: string): ExpandedGroup | null {
    const e = this.expanded()[id];
    return e && e !== 'loading' && e !== 'failed' ? e : null;
  }

  /** Whether a *subsequent* page is in flight, with the current one still on screen. */
  isPageLoading(id: string): boolean {
    return !!this.expandedGroup(id)?.loading;
  }

  private isResourceVisible(res: RestrictedResource): boolean {
    const v = res.resourceVisibility;
    return (
      v.anonymous === Visibility.Visible &&
      v.authenticated === Visibility.Visible &&
      v.projectMember === Visibility.Visible
    );
  }

  /**
   * A resource collapses onto one line (design 1g/1h combo row) when it is itself fully visible and
   * carries exactly one restricted item — the resource + its single item render inline.
   */
  isCombo(res: RestrictedResource): boolean {
    return this.isResourceVisible(res) && (res.items?.length ?? 0) === 1;
  }

  itemIcon(item: RestrictedItem): string {
    return item.type === ItemType.File ? 'image' : item.type === ItemType.Comment ? 'comment' : 'lock';
  }

  /** Translation key for a filter chip label. */
  itemTypeKey(type: ValueItemType): string {
    return `pages.project.viewRestrictions.itemType.${ITEM_TYPE_SLUG[type] ?? 'all'}`;
  }

  /** Translation key for a drill-down row's item-type tag, which still speaks in `ItemType`. */
  drillItemTypeKey(type: ItemType): string {
    const slug = type === ItemType.File ? 'file' : type === ItemType.Comment ? 'comment' : 'value';
    return `pages.project.viewRestrictions.itemType.${slug}`;
  }

  /**
   * Whether a restricted item has its own property label. `propertyLabel` is optional in the API
   * (only `type` and `visibility` are required — a file value typically has no property label), and
   * the template falls back to the *translated* item type rather than the raw enum, which would
   * otherwise show a stray English "File" next to its own translated tag.
   */
  hasPropertyLabel(item: RestrictedItem): boolean {
    return !!item.propertyLabel;
  }
}
