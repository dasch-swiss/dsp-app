import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { provideSearchFilters } from '../../providers';
import { SearchFilterState } from '../../search-filter-state';
import { FilterEditorRequestService } from '../../service/filter-editor-request.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  SEARCH_FILTER_SERVICE_STUBS,
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  SAMPLE_ONTOLOGIES,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { makePredicate } from '../../testing/test-data-builders';
import { AdvancedSearchBarComponent } from './advanced-search-bar.component';

const meta: Meta<AdvancedSearchBarComponent> = {
  title: 'Search / Advanced Search / Search Bar',
  component: AdvancedSearchBarComponent,
  argTypes: {
    projectUuid: { description: 'UUID of the project whose ontologies are loaded.' },
    density: {
      description:
        'Control sizing. `compact` (36px controls, 13px text) is the Data tab treatment for a narrow split column, and also puts the field and the filter controls on one row; `standard` is Material default sizing with the two stacked.',
    },
    searchFieldWidth: { description: 'CSS width of the fulltext field. The Data tab passes a narrower value.' },
    searchLabelKey: { description: 'Translation key for the fulltext field label.' },
    searchPlaceholderKey: { description: 'Translation key for the fulltext field placeholder.' },
    searchIconPosition: {
      description:
        'Where the magnifier sits. `trailing` (default) shows it only while the field is empty, giving way to the clear button. `leading` keeps it on the left permanently so both it and the clear button can show at once.',
    },
    showSearchLabel: {
      description:
        'Whether to float a label above the field. When false the label key becomes the input’s `aria-label` instead, so the field stays named for assistive technology.',
    },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchBarComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  ...provideSearchFilters(),
  ...SEARCH_FILTER_SERVICE_STUBS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
];

export const Empty: Story = {
  name: 'Shows chip bar with no active filters',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Add filter button is rendered', async () => {
      await expect(canvasElement.querySelector('app-add-filter-button')).not.toBeNull();
    });
    await step('Fulltext search input is rendered', async () => {
      await expect(canvasElement.querySelector('input[matInput]')).not.toBeNull();
    });
  },
};

export const LoadingState: Story = {
  name: 'Shows progress bar while ontologies are loading',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar is visible', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
    await step('Chip bar content is hidden during loading', async () => {
      await expect(canvasElement.querySelector('app-add-filter-button')).toBeNull();
    });
  },
};

export const HidesResetWhenNoActiveState: Story = {
  name: 'Reset button is hidden when nothing is set',
  args: { projectUuid: '0001' },
  // The default url-sync stub emits empty params (`of({})`), so hasActiveState$ is false.
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('No Reset button is rendered', async () => {
      const buttons = Array.from(canvasElement.querySelectorAll('button'));
      await expect(buttons.some(b => b.textContent?.includes('Reset'))).toBe(false);
    });
  },
};

// Emits an active search state (a fulltext term) so the Reset button shows, and spies on reset.
const reset = fn().mockName('reset');
const activeSearchState = {
  params$: of({ q: 'foo' }),
  readParams: () => ({ q: 'foo' }),
  writeState: () => {},
  clearAll: reset,
  encodeFilters: () => '',
  decodeFilters: () => [],
  filters$: of([]),
  fulltextTerm$: of('foo'),
  ontologyIri$: of(undefined),
  resourceClassIri$: of(undefined),
  hasActiveState$: of(true),
  setFulltextTerm: () => {},
  setFilters: () => {},
  reset,
};

const activeStateStub = {
  provide: SearchFilterState,
  useValue: activeSearchState as unknown as SearchFilterState,
};

export const ShowsResetWhenActiveAndClearsOnClick: Story = {
  name: 'Reset button shows when a search is active and clears everything on click',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        // Override the default (empty) stub last so active state wins.
        activeStateStub,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    reset.mockClear();
    await step('Reset button is visible', async () => {
      await expect(canvas.getByRole('button', { name: /Reset/i })).toBeTruthy();
    });
    await step('Clicking Reset clears the search state', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Reset/i }));
      await expect(reset).toHaveBeenCalled();
    });
  },
};

// A state carrying a term, with a spy on the clear path.
const setFulltextTerm = fn().mockName('setFulltextTerm');
const termStateStub = {
  provide: SearchFilterState,
  useValue: {
    ...activeSearchState,
    setFulltextTerm,
  } as unknown as SearchFilterState,
};

export const ShowsClearControlWhenTermIsSet: Story = {
  name: 'Search field offers a clear control once a term is entered',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        termStateStub,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    setFulltextTerm.mockClear();
    await step('Clear control is rendered while the field holds a term', async () => {
      await expect(canvasElement.querySelector('[data-cy="clear-search-btn"]')).not.toBeNull();
    });
    await step('Clicking it clears the term immediately, without waiting out the debounce', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="clear-search-btn"]') as HTMLElement);
      await expect(setFulltextTerm).toHaveBeenCalledWith(undefined);
    });
  },
};

export const HidesClearControlWhenEmpty: Story = {
  name: 'Search field shows the search icon, not a clear control, when empty',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('No clear control is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="clear-search-btn"]')).toBeNull();
    });
  },
};

export const LeadingIconWithoutALabel: Story = {
  name: 'Leading magnifier and no floating label is the Data tab input',
  args: {
    projectUuid: '0001',
    density: 'compact',
    searchFieldWidth: '260px',
    searchIconPosition: 'leading',
    showSearchLabel: false,
  },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('The magnifier leads the field and no label floats above it', async () => {
      await expect(canvasElement.querySelector('mat-icon[matPrefix]')).not.toBeNull();
      await expect(canvasElement.querySelector('mat-label')).toBeNull();
    });
    await step('Dropping the label does not leave the field unnamed', async () => {
      // The label key becomes the aria-label, so a screen reader still announces the field.
      const input = canvasElement.querySelector('input') as HTMLInputElement;
      await expect(input.getAttribute('aria-label')).toBeTruthy();
    });
    await step('The magnifier sits beside the text, not adrift from it', async () => {
      // Material ships the prefix icon with 12px of its own horizontal padding, which stacked with
      // the wrapper's spacing and left a 20px dead gap that read as a detached icon.
      const icon = canvasElement.querySelector('mat-icon[matPrefix]') as HTMLElement;
      const input = canvasElement.querySelector('input') as HTMLInputElement;
      const gap = input.getBoundingClientRect().left - icon.getBoundingClientRect().right;
      await expect(gap).toBeLessThanOrEqual(12);
    });
  },
};

const TITLE_PREDICATE = makePredicate(
  `${SAMPLE_ONTOLOGIES[0].iri}#hasTitle`,
  'Title',
  'http://api.knora.org/ontology/knora-api/v2#TextValue',
  false
);

const headerFilterRequests = new FilterEditorRequestService();

/**
 * The Data tab's column headers do not host a filter editor of their own; they name a property and
 * the bar opens its own (DEV-7466 REQ-3.5). Driven here through the real service rather than by
 * calling the method, because the routing *is* what is under test.
 */
export const OpensTheEditorOnAPropertyNamedFromOutsideTheBar: Story = {
  name: 'A column header can ask the bar to open a filter on one property',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ getProperties$: () => of([TITLE_PREDICATE]) }),
        },
        // Held by the story rather than resolved out of the injector, so the request can be raised
        // from outside the component tree exactly as a column header raises it.
        { provide: FilterEditorRequestService, useValue: headerFilterRequests },
      ],
    }),
  ],
  play: async ({ step }) => {
    await step('Naming a property opens the editor, and adds no chip of its own', async () => {
      headerFilterRequests.open(TITLE_PREDICATE.iri);

      // The popover renders into a CDK overlay, which attaches to the body, not to the canvas.
      await waitFor(() => expect(document.body.querySelector('app-filter-editor-popover')).not.toBeNull());
      await expect(document.body.querySelectorAll('app-filter-chip')).toHaveLength(0);
    });
  },
};

export const CompactDensityForTheDataTab: Story = {
  name: 'Compact density shrinks the controls for a narrow column',
  args: { projectUuid: '0001', density: 'compact', searchFieldWidth: '260px' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('The host carries the compact class, so the density tokens apply', async () => {
      await expect(canvasElement.querySelector('app-advanced-search-bar.compact')).not.toBeNull();
    });
    await step('The search field honours the narrower width', async () => {
      const field = canvasElement.querySelector('mat-form-field') as HTMLElement;
      await expect(field.style.width).toBe('260px');
    });
    await step('The field and the filter controls share one row', async () => {
      // Compact is the Data tab's treatment, and there the design of record puts the input,
      // `Add filter` and `Reset` on a single line. Standard density keeps them stacked, because the
      // Search tab projects its data-model and resource-class chips into the leading slot.
      const field = canvasElement.querySelector('mat-form-field') as HTMLElement;
      const chipBar = canvasElement.querySelector('.chip-bar') as HTMLElement;
      const delta = Math.abs(field.getBoundingClientRect().y - chipBar.getBoundingClientRect().y);
      await expect(delta).toBeLessThan(24);
    });
  },
};
