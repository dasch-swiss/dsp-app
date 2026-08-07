import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import {
  GroupBy,
  ItemType,
  PagedResponseRestrictedResource,
  RestrictedItem,
  RestrictedResource,
  RestrictionGroup,
  ViewRestrictionsSummary,
  Visibility,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { take } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { AudienceCount, CountCellComponent, normaliseCounts } from './count-cell.component';
import { ViewRestrictionsPageService } from './view-restrictions-page.service';
import { VisibilityCellComponent } from './visibility-cell.component';

interface ExpandedGroup {
  page: PagedResponseRestrictedResource;
  currentPage: number;
}

/**
 * Translation-key slugs for the API enums. Decoupled from the enum *values* on purpose: the
 * generated client currently emits PascalCase (`ItemType.All === 'All'`), and using those verbatim
 * as i18n keys would silently fall back to the raw key if the API ever changes its casing.
 */
const ITEM_TYPE_SLUG: Record<ItemType, string> = {
  All: 'all',
  Resource: 'resource',
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
  providers: [ViewRestrictionsPageService],
  imports: [
    AsyncPipe,
    TranslatePipe,
    MatIcon,
    MatButtonToggleModule,
    MatChipsModule,
    AppProgressIndicatorComponent,
    PagerComponent,
    VisibilityCellComponent,
    CountCellComponent,
  ],
})
export class ViewRestrictionsComponent {
  // expose enums to the template
  readonly GroupBy = GroupBy;
  readonly ItemType = ItemType;

  readonly itemTypeChips: ItemType[] = [
    ItemType.All,
    ItemType.Resource,
    ItemType.File,
    ItemType.Value,
    ItemType.Comment,
  ];

  readonly summaryState$ = this.vr.summaryState$;
  readonly groupBy$ = this.vr.groupBy$;
  readonly itemType$ = this.vr.itemType$;

  /** Per-group expansion state, keyed by group id. A signal so OnPush re-renders when it changes. */
  readonly expanded = signal<Record<string, ExpandedGroup | 'loading' | 'failed'>>({});

  /** Drill-down page size; also fed to `app-pager` so it can compute the page count. */
  readonly pageSize = 25;

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    protected titleService: Title,
    public vr: ViewRestrictionsPageService,
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

  onGroupBy(value: GroupBy): void {
    this.expanded.set({});
    this.vr.setGroupBy(value);
  }

  onItemType(value: ItemType): void {
    this.expanded.set({});
    this.vr.setItemType(value);
  }

  /** In property mode the "Resource" filter is not meaningful (whole-resource rows are out of scope). */
  isChipDisabled(chip: ItemType): boolean {
    return chip === ItemType.Resource && this.groupBy$.value === GroupBy.Property;
  }

  /**
   * Whether to render the "Resources" column (design 1i: a 96px column between the label and the
   * audience cells). Keyed off the grouping rather than off the presence of `totalResources`, so the
   * column and the grid template can never disagree about how many columns there are — a per-row
   * check would misalign the header and footer if one group happened to lack the field.
   */
  showTotals(groupBy: GroupBy | null): boolean {
    return groupBy === GroupBy.ResourceClass;
  }

  /**
   * The project's whole resource count — the footer's "Resources" cell.
   *
   * Summed over the summary's groups rather than requested separately, so it always agrees with the
   * rows on screen. In class mode the API reports *every* class, including those with no restrictions,
   * so this sum is the project's total resource count and not merely the restricted subset.
   */
  totalResources(groups: RestrictionGroup[] | undefined): number {
    return (groups ?? []).reduce((sum, g) => sum + (g.totalResources ?? 0), 0);
  }

  /**
   * Whether an audience cell has nothing to report, so it renders a dash rather than zeroes.
   *
   * Normalises first, because the API sends `totals` flat but `groups[].counts` nested — reading the flat
   * shape alone would call every nested cell empty and wrongly announce "no restrictions". Checks both
   * states: a cell with only restricted-view counts and nothing hidden is still a finding.
   */
  isEmptyCount(counts: AudienceCount | undefined): boolean {
    const c = normaliseCounts(counts);
    return !c?.hidden && !c?.restrictedView;
  }

  /**
   * Whether the report found no restriction anywhere, even though rows are listed.
   *
   * In class mode the API reports every class in the project, so `groups` is non-empty whenever the
   * project has any resources at all — the `@empty` branch alone would then never fire and a project
   * with nothing restricted would silently render a table of dashes. This says so explicitly.
   */
  hasNoRestrictions(summary: ViewRestrictionsSummary): boolean {
    const t = summary.totals;
    return this.isEmptyCount(t.anonymous) && this.isEmptyCount(t.authenticated) && this.isEmptyCount(t.projectMember);
  }

  toggleGroup(group: RestrictionGroup): void {
    if (this.expanded()[group.id]) {
      const next = { ...this.expanded() };
      delete next[group.id];
      this.expanded.set(next);
      return;
    }
    this.loadPage(group.id, 1);
  }

  loadPage(groupId: string, page: number): void {
    this.expanded.update(e => ({ ...e, [groupId]: 'loading' }));
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

  /** Translation key for an item-type label (chips and per-row tags). */
  itemTypeKey(type: ItemType): string {
    return `pages.project.viewRestrictions.itemType.${ITEM_TYPE_SLUG[type] ?? 'all'}`;
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
