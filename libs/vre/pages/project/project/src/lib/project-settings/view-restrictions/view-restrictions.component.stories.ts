import { provideRouter } from '@angular/router';
import {
  AdminAPIApiService,
  GroupBy,
  ItemType,
  PagedResponseRestrictedResource,
  RestrictedItem,
  RestrictedResource,
  ViewRestrictionsSummary,
  Visibility,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of, throwError } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { ProjectPageService } from '../../project-page.service';
import { ViewRestrictionsComponent } from './view-restrictions.component';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALL_VISIBLE = {
  anonymous: Visibility.Visible,
  authenticated: Visibility.Visible,
  projectMember: Visibility.Visible,
};

const HIDDEN_FROM_PUBLIC = {
  anonymous: Visibility.Hidden,
  authenticated: Visibility.Visible,
  projectMember: Visibility.Visible,
};

const makeSummary = (overrides: Partial<ViewRestrictionsSummary> = {}): ViewRestrictionsSummary => ({
  projectIri: 'http://rdfh.ch/projects/0001',
  groupBy: GroupBy.ResourceClass,
  itemType: ItemType.All,
  groups: [
    {
      id: 'http://www.knora.org/ontology/0001/anything#Thing',
      label: 'Thing',
      ontology: 'anything',
      counts: {
        anonymous: { resources: { hidden: 37, restrictedView: 11 }, items: { hidden: 0, restrictedView: 0 } },
        authenticated: { resources: { hidden: 23, restrictedView: 5 }, items: { hidden: 0, restrictedView: 0 } },
        projectMember: { resources: { hidden: 5, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
      },
      totalResources: 120,
    },
    {
      // restricted view only, and nothing hidden — the case a single conflated count would hide
      id: 'http://www.knora.org/ontology/0001/anything#BlueThing',
      label: 'Blue thing',
      ontology: 'anything',
      counts: {
        anonymous: { resources: { hidden: 3, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
        authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
        projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
      },
      totalResources: 30,
    },
  ],
  totals: {
    anonymous: { resources: { hidden: 40, restrictedView: 11 }, items: { hidden: 0, restrictedView: 0 } },
    authenticated: { resources: { hidden: 23, restrictedView: 5 }, items: { hidden: 0, restrictedView: 0 } },
    projectMember: { resources: { hidden: 5, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
  },
  ...overrides,
});

const makeItem = (overrides: Partial<RestrictedItem> = {}): RestrictedItem => ({
  type: ItemType.Value,
  propertyLabel: 'Has description',
  valueIri: 'http://rdfh.ch/0001/a-thing/values/abc123',
  visibility: HIDDEN_FROM_PUBLIC,
  ...overrides,
});

const makeResource = (overrides: Partial<RestrictedResource> = {}): RestrictedResource => ({
  resourceIri: 'http://rdfh.ch/0001/a-thing',
  label: 'A thing',
  resourceClassIri: 'http://www.knora.org/ontology/0001/anything#Thing',
  resourceVisibility: ALL_VISIBLE,
  items: [makeItem()],
  ...overrides,
});

const makeItemsPage = (
  data: RestrictedResource[],
  pagination: Partial<PagedResponseRestrictedResource['pagination']> = {}
): PagedResponseRestrictedResource => ({
  data,
  pagination: { pageSize: 25, totalItems: data.length, totalPages: 1, currentPage: 1, ...pagination },
});

/**
 * `ProjectPageService.currentProject$` is the only thing the page needs from the project context.
 * `ResourceService.getResourcePath` strips the iriBase, so the stub mirrors the real behaviour.
 */
const sharedProviders = [
  provideRouter([]),
  {
    provide: ProjectPageService,
    useValue: {
      currentProject$: of({ id: 'http://rdfh.ch/projects/0001', shortname: 'anything', shortcode: '0001' }),
    },
  },
  {
    provide: ResourceService,
    useValue: { getResourcePath: (iri: string) => iri.replace('http://rdfh.ch', '') },
  },
];

const withApi = (summary: unknown, items: unknown) =>
  applicationConfig({
    providers: [
      ...sharedProviders,
      {
        provide: AdminAPIApiService,
        useValue: {
          getAdminProjectsIriProjectiriViewRestrictionsSummary: () => summary,
          getAdminProjectsIriProjectiriViewRestrictionsItems: () => items,
        },
      },
    ],
  });

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<ViewRestrictionsComponent> = {
  title: 'Project Settings / View Restrictions',
  component: ViewRestrictionsComponent,
  argTypes: {
    expanded: {
      description:
        'Per-group drill-down state keyed by group id. Each entry is either the loaded page, ' +
        "'loading' while it is being fetched, or 'failed' if the fetch errored.",
      table: { category: 'State', type: { summary: "Signal<Record<string, ExpandedGroup | 'loading' | 'failed'>>" } },
    },
    pageSize: {
      description: 'Drill-down page size; also passed to app-pager so it can compute the page count.',
      table: { category: 'Inputs', type: { summary: 'number' }, defaultValue: { summary: '25' } },
    },
    itemTypeChips: {
      description: 'The item-type filter chips, in display order.',
      table: { category: 'Inputs', type: { summary: 'ItemType[]' } },
    },
  },
};
export default meta;
type Story = StoryObj<ViewRestrictionsComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const ShowsMatrixWithPerAudienceCounts: Story = {
  name: 'Shows the per-audience matrix with a totals row',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Both resource-class groups are listed', async () => {
      await expect(canvas.getByText('Thing')).toBeInTheDocument();
      await expect(canvas.getByText('Blue thing')).toBeInTheDocument();
    });
    await step('The totals row sums the hidden counts across groups', async () => {
      // 37 (Thing) + 3 (Blue thing) hidden resources for the anonymous audience
      await expect(canvas.getByText('40')).toBeInTheDocument();
    });
  },
};

export const ShowsDashForAudiencesWithNoRestrictions: Story = {
  name: 'Shows a dash instead of zero when an audience has no restrictions',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Zero counts render as an en dash rather than "0"', async () => {
      // "Blue thing" is hidden from anonymous only, so two of its cells are zero
      await expect(canvas.getAllByText('–').length).toBeGreaterThan(0);
    });
  },
};

export const ShowsSpinnerWhileLoadingSummary: Story = {
  name: 'Shows a progress indicator while the summary is loading',
  decorators: [withApi(NEVER, NEVER)],
  play: async ({ canvasElement, step }) => {
    await step('Progress indicator is rendered', async () => {
      await expect(canvasElement.querySelector('app-progress-indicator')).not.toBeNull();
    });
  },
};

export const ShowsErrorWhenSummaryFails: Story = {
  name: 'Shows an error message instead of spinning forever when the summary fails',
  decorators: [
    withApi(
      throwError(() => new Error('boom')),
      NEVER
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The failure message replaces the spinner', async () => {
      await expect(canvas.getByText(/could not be loaded/i)).toBeInTheDocument();
      await expect(canvasElement.querySelector('app-progress-indicator')).toBeNull();
    });
  },
};

export const ShowsEmptyStateWhenNoRestrictionsExist: Story = {
  name: 'Shows an empty state when no group has restrictions',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [],
          totals: {
            anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
            authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
            projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
          },
        })
      ),
      of(makeItemsPage([]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The "no restrictions" message is shown', async () => {
      await expect(canvas.getByText(/No restrictions found/i)).toBeInTheDocument();
    });
  },
};

export const ShowsResourcePopulationPerClass: Story = {
  name: 'Shows each class’s resource population next to its restriction counts',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The Resources column header is present in class mode', async () => {
      // scoped to the header row: the "Resources" item-type chip carries the same label
      await expect(canvasElement.querySelector('.matrix-head .col-total')?.textContent).toContain('Resources');
    });
    await step('Each class reports its own population', async () => {
      const populations = Array.from(canvasElement.querySelectorAll('.matrix-row .col-total')).map(e =>
        e.textContent?.trim()
      );
      await expect(populations).toContain('120');
      await expect(populations).toContain('30');
    });
    await step('The footer sums the populations of the listed classes', async () => {
      await expect(canvasElement.querySelector('.matrix-foot .col-total')?.textContent?.trim()).toBe('150');
    });
  },
};

export const ShowsUnrestrictedClassWithItsPopulation: Story = {
  name: 'Lists a class with no restrictions, with its resource count intact',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [
            ...makeSummary().groups!,
            {
              // nothing restricted, but the class still has 500 resources — the count is a property of
              // the class, not of the restrictions
              id: 'http://www.knora.org/ontology/0001/anything#OpenThing',
              label: 'Open thing',
              ontology: 'anything',
              counts: {
                anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
              },
              totalResources: 500,
            },
          ],
        })
      ),
      of(makeItemsPage([makeResource()]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The unrestricted class is listed', async () => {
      await expect(canvas.getByText('Open thing')).toBeInTheDocument();
      await expect(canvas.getByText('500')).toBeInTheDocument();
    });
    await step('Its population counts towards the footer total', async () => {
      // 120 + 30 + 500
      await expect(canvas.getByText('650')).toBeInTheDocument();
    });
  },
};

export const ShowsNoteWhenNothingIsRestricted: Story = {
  name: 'States that nothing is restricted rather than showing a table of dashes',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [
            {
              id: 'http://www.knora.org/ontology/0001/anything#OpenThing',
              label: 'Open thing',
              ontology: 'anything',
              counts: {
                anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
              },
              totalResources: 500,
            },
          ],
          totals: {
            anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
            authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
            projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
          },
        })
      ),
      of(makeItemsPage([]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The "no restrictions" note is shown even though a row is listed', async () => {
      await expect(canvas.getByText(/No restrictions found/i)).toBeInTheDocument();
      await expect(canvas.getByText('Open thing')).toBeInTheDocument();
    });
  },
};

export const ShowsHiddenAndRestrictedViewSeparately: Story = {
  name: 'Splits each count into hidden and restricted view',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // "Thing" is 37 hidden + 11 in restricted view for the anonymous audience. Hidden and restricted
    // view are disjoint outcomes and must appear as their own figures, never as a single summed number.
    // (getAllByText, not getByText: the same figure legitimately appears in the row and the totals row.)
    await step('Both states are rendered as distinct counts', async () => {
      await expect(canvas.getAllByText('37').length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('11').length).toBeGreaterThan(0);
    });
    await step('The two states use their own icons', async () => {
      await expect(canvasElement.querySelector('.count-hidden')).not.toBeNull();
      await expect(canvasElement.querySelector('.count-restricted')).not.toBeNull();
    });
  },
};

/**
 * The regression this guards against: filtering by an item type returns findings in the `items` unit and
 * nothing in `resources`, because whole resources are not in scope for that filter. A cell that always
 * rendered the `resources` unit therefore showed a dash in every column over a report that had findings —
 * the matrix blanked exactly when the user narrowed to what they cared about (DEV-6868).
 *
 * The payload mirrors a real response for incunabula with `itemType=Value`.
 */
export const ReportsItemLevelFindingsUnderAnItemFilter: Story = {
  name: 'Reports item-level findings when the item-type filter is item-level',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [
            {
              id: 'http://www.knora.org/ontology/0803/incunabula#t',
              label: 't',
              ontology: 'incunabula',
              counts: {
                anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } },
                authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } },
                projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
              },
              totalResources: 1,
            },
          ],
          totals: {
            anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } },
            authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } },
            projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
          },
        })
      ),
      of(makeItemsPage([makeResource()]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Narrow the filter to values, as the user would', async () => {
      // the page starts on "All"; the cells follow whichever chip is selected.
      // The chip reads "Values" (itemType.value), not "Value".
      await userEvent.click(canvas.getByText('Values'));
    });
    await step('The hidden value is reported rather than swallowed', async () => {
      await expect(canvas.getByText('t')).toBeInTheDocument();
      await expect(canvasElement.querySelector('.count-hidden')).not.toBeNull();
    });
    await step('The report is not announced as having no restrictions', async () => {
      await expect(canvasElement.querySelector('.empty-note')).toBeNull();
    });
  },
};

export const ShowsManyRestrictedValuesOnOneResource: Story = {
  name: 'Never claims more restricted resources than the class has (the "3 of 1" case)',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [
            {
              // ONE resource in the class, itself fully visible, carrying THREE hidden values. Summing the
              // units would render "3" against a population of 1; the matrix reports the resources unit
              // only, so the cell stays empty and the three values surface in the drill-down.
              id: 'http://www.knora.org/ontology/0001/anything#Sparse',
              label: 'Sparse thing',
              ontology: 'anything',
              counts: {
                anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 3, restrictedView: 0 } },
                authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 3, restrictedView: 0 } },
                projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
              },
              totalResources: 1,
            },
          ],
          totals: {
            anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 3, restrictedView: 0 } },
            authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 3, restrictedView: 0 } },
            projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
          },
        })
      ),
      of(makeItemsPage([makeResource()]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The population column shows the true population, not the restriction count', async () => {
      await expect(canvas.getByText('Sparse thing')).toBeInTheDocument();
      await expect(canvas.getAllByText('1').length).toBeGreaterThan(0);
    });
    await step('The three restrictions are reported as values, in their own line', async () => {
      // the same figure appears in the class row and the totals row, so match all of them
      await expect(canvas.getAllByText('3').length).toBeGreaterThan(0);
      // one line per unit with something to report; here only the items unit qualifies
      await expect(canvasElement.querySelectorAll('.count-line').length).toBeGreaterThan(0);
    });
    await step('No row claims more restricted resources than the class contains', async () => {
      // "4" is resources + items summed — the figure the API documents as meaningless
      await expect(canvas.queryByText('4')).toBeNull();
    });
    await step('The row is still reported rather than announced as unrestricted', async () => {
      await expect(canvasElement.querySelector('.empty-note')).toBeNull();
    });
  },
};

/**
 * In class mode the API lists every class, restricted or not, so most rows on a healthy project have
 * nothing beneath them. Clicking one used to expand it onto an empty list — the chevron turned, no
 * content appeared, and it read as a panel that opened and shut by itself.
 */
export const DoesNotOpenAClassWithNothingToShow: Story = {
  name: 'Makes a class with nothing restricted inert instead of opening it onto an empty list',
  decorators: [
    withApi(
      of(
        makeSummary({
          groups: [
            ...makeSummary().groups!,
            {
              id: 'http://www.knora.org/ontology/0001/anything#OpenThing',
              label: 'Open thing',
              ontology: 'anything',
              counts: {
                anonymous: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                authenticated: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
                projectMember: { resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } },
              },
              totalResources: 500,
            },
          ],
        })
      ),
      of(makeItemsPage([makeResource()]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rowFor = (label: string) =>
      Array.from(canvasElement.querySelectorAll<HTMLButtonElement>('.matrix-row')).find(r =>
        r.textContent?.includes(label)
      )!;

    await step('The unrestricted class is still listed, with its population', async () => {
      await expect(canvas.getByText('Open thing')).toBeInTheDocument();
      await expect(canvas.getByText('500')).toBeInTheDocument();
    });
    await step('It offers no chevron, so it does not present itself as openable', async () => {
      await expect(rowFor('Open thing').querySelector('.chevron')).toBeNull();
      await expect(rowFor('Thing').querySelector('.chevron')).not.toBeNull();
    });
    await step('Clicking it does nothing — no drill-down appears', async () => {
      await userEvent.click(canvas.getByText('Open thing'), { pointerEventsCheck: 0 });
      await expect(canvas.queryByText('A thing')).not.toBeInTheDocument();
    });
    await step('A class that does have findings still opens', async () => {
      await userEvent.click(canvas.getByText('Thing'));
      await expect(canvas.getByText('A thing')).toBeInTheDocument();
    });
  },
};

/**
 * Colour is the only thing separating hidden from restricted view at a glance. Explained once in a
 * legend rather than per figure — a matrix carries dozens of them, and the same two glyphs mark the
 * drill-down rows, so one key serves the whole page.
 */
export const ExplainsTheStateIconsInALegend: Story = {
  name: 'Explains the two state icons in a legend under the matrix',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Both states are spelled out, consequence and all', async () => {
      await expect(canvas.getByText(/Hidden — nothing is served/i)).toBeInTheDocument();
      await expect(canvas.getByText(/Restricted view — a degraded version is served/i)).toBeInTheDocument();
    });
    await step('The legend keys on the same glyphs the cells render', async () => {
      const legend = canvasElement.querySelector('.legend');
      await expect(legend?.querySelector('.legend-hidden')?.textContent?.trim()).toBe('visibility_off');
      await expect(legend?.querySelector('.legend-restricted')?.textContent?.trim()).toBe('blur_on');
    });
    await step('It is a key to the table, not a replacement for it', async () => {
      // the legend follows the matrix rather than pushing it down the page
      const matrix = canvasElement.querySelector('.matrix')!;
      const legend = canvasElement.querySelector('.legend')!;
      await expect(matrix.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  },
};

export const ExpandsGroupToRevealAffectedResources: Story = {
  name: 'Reveals the affected resources when a group row is clicked',
  decorators: [
    withApi(
      of(makeSummary()),
      of(
        makeItemsPage([
          makeResource({
            resourceVisibility: HIDDEN_FROM_PUBLIC,
            items: [makeItem({ propertyLabel: 'Has description' }), makeItem({ propertyLabel: 'Has comment' })],
          }),
        ])
      )
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The drill-down is collapsed initially', async () => {
      await expect(canvas.queryByText('A thing')).not.toBeInTheDocument();
    });
    await step('User clicks the group row', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The affected resource and its restricted items appear', async () => {
      await expect(canvas.getByText('A thing')).toBeInTheDocument();
      await expect(canvas.getByText('Has description')).toBeInTheDocument();
      await expect(canvas.getByText('Has comment')).toBeInTheDocument();
    });
  },
};

export const CollapsesGroupOnSecondClick: Story = {
  name: 'Collapses the drill-down when the group row is clicked again',
  decorators: [
    withApi(of(makeSummary()), of(makeItemsPage([makeResource({ resourceVisibility: HIDDEN_FROM_PUBLIC })]))),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands then collapses the group', async () => {
      await userEvent.click(canvas.getByText('Thing'));
      await expect(canvas.getByText('A thing')).toBeInTheDocument();
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The affected resource is hidden again', async () => {
      await expect(canvas.queryByText('A thing')).not.toBeInTheDocument();
    });
  },
};

export const ShowsErrorWhenDrillDownFails: Story = {
  name: 'Shows an error in the expanded row when the drill-down fails',
  decorators: [
    withApi(
      of(makeSummary()),
      throwError(() => new Error('boom'))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands a group whose items fail to load', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The row shows a failure message rather than a stuck spinner', async () => {
      await expect(canvas.getByText(/affected resources could not be loaded/i)).toBeInTheDocument();
      await expect(canvasElement.querySelector('app-progress-indicator')).toBeNull();
    });
  },
};

export const RendersSingleItemResourceAsOneComboRow: Story = {
  name: 'Collapses a fully-visible resource with one restricted item onto a single row',
  decorators: [
    withApi(
      of(makeSummary()),
      // resource itself fully visible + exactly one item => combo row
      of(makeItemsPage([makeResource({ resourceVisibility: ALL_VISIBLE, items: [makeItem()] })]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands the group', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The resource and its single item share one row', async () => {
      const comboRow = canvasElement.querySelector('.col-group.combo');
      await expect(comboRow).not.toBeNull();
      await expect(comboRow!.textContent).toContain('A thing');
      await expect(comboRow!.textContent).toContain('Has description');
    });
  },
};

export const FallsBackToTranslatedTypeWhenItemHasNoLabel: Story = {
  name: 'Uses the translated item type as the label when a property label is missing',
  decorators: [
    withApi(
      of(makeSummary()),
      of(
        makeItemsPage([
          makeResource({
            resourceVisibility: HIDDEN_FROM_PUBLIC,
            // propertyLabel is optional in the API — a file value typically has none
            items: [makeItem({ type: ItemType.File, propertyLabel: undefined, valueIri: undefined })],
          }),
        ])
      )
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands the group', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The label reads the translated type, never the raw "File" enum value', async () => {
      // en.json maps itemType.file to "File values"
      await expect(canvas.getAllByText('File values').length).toBeGreaterThan(0);
    });
  },
};

export const LabelsVisibilityForAssistiveTechWhenNoIconIsShown: Story = {
  name: 'Labels a fully-visible cell even though it renders no icon',
  decorators: [
    withApi(
      of(makeSummary()),
      of(makeItemsPage([makeResource({ resourceVisibility: HIDDEN_FROM_PUBLIC, items: [] })]))
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands the group', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('Visible cells carry an accessible name despite showing no glyph', async () => {
      // the resource is hidden from anonymous only, so the other two cells are "Visible"
      const visibleCells = canvas.getAllByLabelText('Visible');
      await expect(visibleCells.length).toBeGreaterThan(0);
      await expect(visibleCells[0].querySelector('mat-icon')).toBeNull();
    });
    await step('The hidden cell is both labelled and shows an icon', async () => {
      const hiddenCell = canvas.getAllByLabelText('Hidden')[0];
      await expect(hiddenCell.querySelector('mat-icon')).not.toBeNull();
    });
  },
};

export const PagesThroughAffectedResources: Story = {
  name: 'Fetches the next page when the pager advances',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsIriProjectiriViewRestrictionsSummary: () => of(makeSummary()),
            // echo the requested page into the label so the story can assert which page is shown
            getAdminProjectsIriProjectiriViewRestrictionsItems: (
              _iri: string,
              _group: string,
              _groupBy: GroupBy,
              _itemType: ItemType,
              page = 1
            ) =>
              of(
                makeItemsPage(
                  [
                    makeResource({
                      resourceIri: `http://rdfh.ch/0001/thing-p${page}`,
                      label: `Thing on page ${page}`,
                      resourceVisibility: HIDDEN_FROM_PUBLIC,
                      items: [],
                    }),
                  ],
                  { totalItems: 60, totalPages: 3, currentPage: page }
                )
              ),
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User expands a group with several pages', async () => {
      await userEvent.click(canvas.getByText('Thing'));
    });
    await step('The first page is shown', async () => {
      await expect(canvas.getByText('Thing on page 1')).toBeInTheDocument();
    });
    await step('User advances the pager', async () => {
      await userEvent.click(canvasElement.querySelector<HTMLButtonElement>('[data-testid="next-page"]')!);
    });
    await step('The second page is fetched and shown', async () => {
      await expect(canvas.getByText('Thing on page 2')).toBeInTheDocument();
      await expect(canvas.queryByText('Thing on page 1')).not.toBeInTheDocument();
    });
  },
};

export const DisablesResourceChipInPropertyMode: Story = {
  name: 'Disables the Resource filter when grouping by property',
  decorators: [withApi(of(makeSummary()), of(makeItemsPage([makeResource()])))],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User switches the grouping to Property', async () => {
      await userEvent.click(canvas.getByText('Property'));
    });
    await step('The Resource chip becomes disabled (whole-resource rows are out of scope)', async () => {
      // The column header shares the "Resources" label, so find the chip among the chips. Material puts
      // aria-disabled on the inner [role="option"], not on the mat-chip-option host (which is
      // role="presentation") — asserting on the host silently reads null and passes nothing.
      const chip = Array.from(canvasElement.querySelectorAll('mat-chip-option')).find(c =>
        c.textContent?.trim().startsWith('Resources')
      );
      await expect(chip?.querySelector('[role="option"]')?.getAttribute('aria-disabled')).toBe('true');
    });
  },
};
