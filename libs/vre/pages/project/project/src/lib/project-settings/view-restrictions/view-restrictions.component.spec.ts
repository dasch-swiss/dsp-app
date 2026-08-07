import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  AdminAPIApiService,
  GroupBy,
  ItemType,
  PagedResponseRestrictedResource,
  ViewRestrictionsSummary,
  Visibility,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { SummaryState } from './view-restrictions-page.service';
import { ViewRestrictionsComponent } from './view-restrictions.component';

const summary: ViewRestrictionsSummary = {
  projectIri: 'http://rdfh.ch/projects/0001',
  groupBy: GroupBy.ResourceClass,
  itemType: ItemType.All,
  groups: [
    {
      id: 'http://www.knora.org/ontology/0001/anything#Thing',
      label: 'Thing',
      ontology: 'anything',
      counts: {
        anonymous: { hidden: 15, restrictedView: 4 },
        authenticated: { hidden: 14, restrictedView: 2 },
        projectMember: { hidden: 5, restrictedView: 0 },
      },
      // the class population, of which the counts above are a part
      totalResources: 120,
    },
  ],
  totals: {
    anonymous: { hidden: 15, restrictedView: 4 },
    authenticated: { hidden: 14, restrictedView: 2 },
    projectMember: { hidden: 5, restrictedView: 0 },
  },
};

const itemsPage: PagedResponseRestrictedResource = {
  data: [
    {
      resourceIri: 'http://rdfh.ch/0001/a-thing',
      label: 'A thing',
      resourceClassIri: 'http://www.knora.org/ontology/0001/anything#Thing',
      resourceVisibility: {
        anonymous: Visibility.Hidden,
        authenticated: Visibility.Visible,
        projectMember: Visibility.Visible,
      },
      items: [],
    },
  ],
  pagination: { pageSize: 25, totalItems: 1, totalPages: 1, currentPage: 1 },
};

describe('ViewRestrictionsComponent', () => {
  let fixture: ComponentFixture<ViewRestrictionsComponent>;
  let component: ViewRestrictionsComponent;

  const adminApiMock = {
    getAdminProjectsIriProjectiriViewRestrictionsSummary: jest.fn().mockReturnValue(of(summary)),
    getAdminProjectsIriProjectiriViewRestrictionsItems: jest.fn().mockReturnValue(of(itemsPage)),
  };

  const projectPageServiceMock = {
    currentProject$: of({ id: 'http://rdfh.ch/projects/0001', shortname: 'anything', shortcode: '0001' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRestrictionsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AdminAPIApiService, useValue: adminApiMock },
        { provide: ProjectPageService, useValue: projectPageServiceMock },
        // getResourcePath strips the iriBase (http://rdfh.ch) leaving /{shortcode}/{uuid}
        { provide: ResourceService, useValue: { getResourcePath: (iri: string) => iri.replace('http://rdfh.ch', '') } },
        provideTranslateService(),
        TranslateService,
      ],
    })
      .overrideComponent(ViewRestrictionsComponent, { set: { template: '<div>Mock Template</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ViewRestrictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the summary for the current project (final state not loading)', done => {
    // startWith emits { loading: true } first, then the loaded state; assert the loaded one.
    const states: unknown[] = [];
    component.summaryState$.subscribe(state => {
      states.push(state);
      if (!state.loading) {
        expect(state.summary?.groups?.length).toBe(1);
        expect(state.summary?.totals.anonymous.hidden).toBe(15);
        expect(state.summary?.totals.anonymous.restrictedView).toBe(4);
        // the first emission must have been the loading sentinel
        expect((states[0] as { loading: boolean }).loading).toBe(true);
        done();
      }
    });
  });

  it('sets the browser title for the current project', () => {
    expect(TestBed.inject(Title).getTitle()).toBe('Project anything | View restrictions');
  });

  it('expands a group and stores the fetched items (resolves the loading state)', () => {
    const group = summary.groups![0];
    component.toggleGroup(group);
    expect(adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems).toHaveBeenCalledWith(
      'http://rdfh.ch/projects/0001',
      group.id,
      GroupBy.ResourceClass,
      ItemType.All,
      1,
      25
    );
    // 'of(...)' resolves synchronously, so loading must have advanced to the loaded state
    expect(component.isLoading(group.id)).toBe(false);
    expect(component.isExpanded(group.id)).toBe(true);
    expect(component.expandedGroup(group.id)?.page.data.length).toBe(1);
  });

  it('collapses an expanded group on second toggle', () => {
    const group = summary.groups![0];
    component.toggleGroup(group);
    component.toggleGroup(group);
    expect(component.isExpanded(group.id)).toBe(false);
  });

  it('resets expansion and updates the filter when the item type changes', () => {
    const group = summary.groups![0];
    component.toggleGroup(group);
    component.onItemType(ItemType.Value);
    expect(component.isExpanded(group.id)).toBe(false);
    expect(component.vr.itemType$.value).toBe(ItemType.Value);
  });

  it('disables the Resource chip in property mode', () => {
    component.onGroupBy(GroupBy.Property);
    expect(component.isChipDisabled(ItemType.Resource)).toBe(true);
    expect(component.isChipDisabled(ItemType.Value)).toBe(false);
  });

  it('builds item-type translation keys from lowercase slugs, not the raw enum casing', () => {
    expect(component.itemTypeKey(ItemType.All)).toBe('pages.project.viewRestrictions.itemType.all');
    expect(component.itemTypeKey(ItemType.File)).toBe('pages.project.viewRestrictions.itemType.file');
    expect(component.itemTypeKey(ItemType.Comment)).toBe('pages.project.viewRestrictions.itemType.comment');
  });

  it('falls back to the translated item type when an item has no property label', () => {
    // propertyLabel is optional in the API; without this the template would render the raw enum
    expect(component.hasPropertyLabel({ type: ItemType.File, visibility: {} } as never)).toBe(false);
    expect(
      component.hasPropertyLabel({ type: ItemType.File, propertyLabel: 'Has image', visibility: {} } as never)
    ).toBe(true);
  });

  describe('pager adapter (app-pager is 0-based, the API is 1-based)', () => {
    it('translates a 0-based page index into the 1-based API page', () => {
      const group = summary.groups![0];
      component.toggleGroup(group); // loads page 1
      adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems.mockClear();

      component.onPageIndexChanged(group.id, 2);

      expect(adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems).toHaveBeenCalledWith(
        'http://rdfh.ch/projects/0001',
        group.id,
        GroupBy.ResourceClass,
        ItemType.All,
        3,
        25
      );
    });

    it('ignores an event naming the page already shown, so expanding does not refetch page 1', () => {
      const group = summary.groups![0];
      component.toggleGroup(group); // loads page 1 => currentPage 1
      adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems.mockClear();

      // app-pager resets its index to 0 when numberOfAllResults changes and emits it
      component.onPageIndexChanged(group.id, 0);

      expect(adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems).not.toHaveBeenCalled();
      expect(component.expandedGroup(group.id)?.currentPage).toBe(1);
    });
  });

  describe('links', () => {
    it('resourceLink builds /resource/{shortcode}/{uuid} from the resource IRI', () => {
      expect(component.resourceLink('http://rdfh.ch/0001/a-thing')).toBe('/resource/0001/a-thing');
    });

    it('itemLink deep-links to the value via highlightValue (value UUID = last IRI segment)', () => {
      expect(component.itemLink('http://rdfh.ch/0001/a-thing', 'http://rdfh.ch/0001/a-thing/values/xyz')).toBe(
        '/resource/0001/a-thing?highlightValue=xyz'
      );
    });

    it('itemLink falls back to the resource link when there is no value IRI', () => {
      expect(component.itemLink('http://rdfh.ch/0001/a-thing', undefined)).toBe('/resource/0001/a-thing');
    });
  });

  describe('error handling', () => {
    it('resolves the summary to a failed state instead of spinning forever', () => {
      const states: SummaryState[] = [];
      const sub = component.summaryState$.subscribe(state => states.push(state));

      adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsSummary.mockReturnValueOnce(
        throwError(() => new Error('boom'))
      );
      // re-trigger the stream so the failing mock is the one that gets used
      component.onItemType(ItemType.Value);

      expect(states.at(-1)?.loading).toBe(false);
      expect(states.at(-1)?.failed).toBe(true);
      expect(states.at(-1)?.summary).toBeUndefined();

      sub.unsubscribe();
    });

    it('keeps working after a failed summary: the next filter change retries', () => {
      const states: SummaryState[] = [];
      // subscribe first, so this sees the failure and the recovery in order rather than a replay
      const sub = component.summaryState$.subscribe(state => states.push(state));

      adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsSummary.mockReturnValueOnce(
        throwError(() => new Error('boom'))
      );
      component.onItemType(ItemType.Value);
      expect(states.at(-1)?.failed).toBe(true);

      // catchError sits on the inner request, so the outer stream survives and refetches
      component.onItemType(ItemType.File);
      expect(states.at(-1)?.failed).toBeUndefined();
      expect(states.at(-1)?.summary?.groups?.length).toBe(1);

      sub.unsubscribe();
    });

    it('marks a drill-down group as failed instead of leaving it on loading', () => {
      adminApiMock.getAdminProjectsIriProjectiriViewRestrictionsItems.mockReturnValueOnce(
        throwError(() => new Error('boom'))
      );
      const group = summary.groups![0];

      component.toggleGroup(group);

      expect(component.isLoading(group.id)).toBe(false);
      expect(component.isFailed(group.id)).toBe(true);
      expect(component.expandedGroup(group.id)).toBeNull();
    });
  });

  describe('isCombo (single-item resources render on one line)', () => {
    const visible = {
      anonymous: Visibility.Visible,
      authenticated: Visibility.Visible,
      projectMember: Visibility.Visible,
    };
    const item = {
      type: ItemType.Value,
      visibility: { anonymous: Visibility.Hidden, authenticated: Visibility.Hidden, projectMember: Visibility.Visible },
    };

    it('is a combo when the resource is fully visible and has exactly one item', () => {
      expect(
        component.isCombo({
          resourceIri: 'r',
          label: 'R',
          resourceClassIri: 'c',
          resourceVisibility: visible,
          items: [item],
        })
      ).toBe(true);
    });

    it('is NOT a combo when the resource has more than one item', () => {
      expect(
        component.isCombo({
          resourceIri: 'r',
          label: 'R',
          resourceClassIri: 'c',
          resourceVisibility: visible,
          items: [item, item],
        })
      ).toBe(false);
    });

    it('is NOT a combo when the resource itself is restricted', () => {
      const restricted = { ...visible, anonymous: Visibility.Hidden };
      expect(
        component.isCombo({
          resourceIri: 'r',
          label: 'R',
          resourceClassIri: 'c',
          resourceVisibility: restricted,
          items: [item],
        })
      ).toBe(false);
    });

    it('is NOT a combo when the resource has no items (whole-resource restriction)', () => {
      expect(
        component.isCombo({
          resourceIri: 'r',
          label: 'R',
          resourceClassIri: 'c',
          resourceVisibility: visible,
          items: [],
        })
      ).toBe(false);
    });
  });

  describe('resources column (design 1i)', () => {
    it('is shown when grouping by resource class', () => {
      expect(component.showTotals(GroupBy.ResourceClass)).toBe(true);
    });

    // A property groups values across classes, so it has no resource population of its own and the
    // API omits totalResources — the column has to disappear with it or the grid would misalign.
    it('is hidden when grouping by property', () => {
      expect(component.showTotals(GroupBy.Property)).toBe(false);
    });

    it('is hidden before the grouping is known', () => {
      expect(component.showTotals(null)).toBe(false);
    });

    it('sums the per-class populations for the footer', () => {
      expect(
        component.totalResources([
          { id: 'a', label: 'A', counts: summary.totals, totalResources: 120 },
          { id: 'b', label: 'B', counts: summary.totals, totalResources: 30 },
        ])
      ).toBe(150);
    });

    // In property mode every group lacks the field; the footer must read 0 rather than NaN.
    it('treats a missing population as zero rather than NaN', () => {
      expect(component.totalResources([{ id: 'a', label: 'A', counts: summary.totals }])).toBe(0);
      expect(component.totalResources(undefined)).toBe(0);
    });

    // The population is independent of the restrictions: an unrestricted class is still reported with its
    // resource count, and it still counts towards the footer total.
    it('counts an unrestricted class towards the total', () => {
      const zero = {
        anonymous: { hidden: 0, restrictedView: 0 },
        authenticated: { hidden: 0, restrictedView: 0 },
        projectMember: { hidden: 0, restrictedView: 0 },
      };
      expect(
        component.totalResources([
          { id: 'a', label: 'A', counts: summary.totals, totalResources: 120 },
          { id: 'b', label: 'B', counts: zero, totalResources: 500 },
        ])
      ).toBe(620);
    });
  });

  describe('hasNoRestrictions', () => {
    const zero = {
      anonymous: { hidden: 0, restrictedView: 0 },
      authenticated: { hidden: 0, restrictedView: 0 },
      projectMember: { hidden: 0, restrictedView: 0 },
    };

    // Class mode lists every class, so rows exist even with nothing restricted — the component has to
    // recognise that state explicitly or the page renders a table of dashes with no explanation.
    it('is true when every audience total is zero', () => {
      expect(component.hasNoRestrictions({ ...summary, groups: [], totals: zero })).toBe(true);
    });

    it('is false when anything is hidden', () => {
      expect(component.hasNoRestrictions(summary)).toBe(false);
    });

    // Restricted-view-only must not read as "no restrictions" — that is the conflation 1i undoes.
    it('is false when only restricted view is non-zero', () => {
      expect(
        component.hasNoRestrictions({
          ...summary,
          totals: {
            ...zero,
            anonymous: { hidden: 0, restrictedView: 2 },
          },
        })
      ).toBe(false);
    });
  });

  describe('isEmptyCount', () => {
    it('is empty only when both states are zero', () => {
      expect(component.isEmptyCount({ hidden: 0, restrictedView: 0 })).toBe(true);
      expect(component.isEmptyCount(undefined)).toBe(true);
    });

    // A cell with only restricted-view items must still render — folding it into "no restrictions"
    // is exactly the conflation screen 1i exists to undo.
    it('is not empty when only restricted view is non-zero', () => {
      expect(component.isEmptyCount({ hidden: 0, restrictedView: 3 })).toBe(false);
    });

    it('is not empty when only hidden is non-zero', () => {
      expect(component.isEmptyCount({ hidden: 2, restrictedView: 0 })).toBe(false);
    });

    // The API is inconsistent: `totals` is flat but `groups[].counts` is nested. Reading only the flat
    // shape called every nested cell empty, which blanked the whole matrix against live data.
    it('reads the nested shape too, rather than calling it empty', () => {
      expect(
        component.isEmptyCount({
          resources: { hidden: 7, restrictedView: 3 },
          items: { hidden: 12, restrictedView: 4 },
        })
      ).toBe(false);
      expect(
        component.isEmptyCount({ resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } })
      ).toBe(true);
    });
  });

  // The population column and the audience cells answer different questions: the restriction counts must
  // never feed the population total, or a heavily restricted class would inflate its own denominator.
  describe('count units', () => {
    it('sums the class population from totalResources alone, never from the counts', () => {
      expect(
        component.totalResources([
          {
            id: 'c',
            label: 'C',
            counts: { ...summary.totals, anonymous: { hidden: 3, restrictedView: 0 } },
            totalResources: 1,
          },
        ])
      ).toBe(1);
    });
  });
});
